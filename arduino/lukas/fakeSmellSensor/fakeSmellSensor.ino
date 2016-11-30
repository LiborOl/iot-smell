#include <SoftwareSerial.h>
#include <stdlib.h>

SoftwareSerial loraSerial(10, 11); // RX, TX

int redLedPin = 13;
int greenLedPin = 3;

void setup() {
  pinMode(redLedPin, OUTPUT); //red led out
  pinMode(greenLedPin, OUTPUT); //green led out

  randomSeed(analogRead(0));

  // start serial port at 57600 bps and wait for port to open:
  Serial.begin(57600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  };

  loraSerial.begin(57600);

  establishLora();
}

void loop() {
  int loraStatus = getStatus() & 0x0f;
  if (loraStatus == 0) { //not joined
    establishLora(); //establish the connection
  } else if (loraStatus > 1) { //busy
    // light up both diodes
    digitalWrite(redLedPin, HIGH); //light the red led
    digitalWrite(greenLedPin, HIGH); //light the red led
    delay(20000);
    return;
  }

  //LoRa is ready to transmit, lets do that
  
  int airPollution = 120 + (random(100) - 50); // 120 +- 50
  float temperature = 28.65 + (random(20) - 10); // 28.65 +- 10
  float humidity = 45.1 + (random(20) - 10); // 45.1 +- 10
  int battery = 0x80ff + (random(100) - 50); // +- 50

  //Transform the data into HEXa String
  String data = getData(airPollution, temperature, humidity, battery);
  send(data);

  delay(30000); //wait for 30 seconds to the next round.
}

void send(String msg) {
  Serial.print("mac tx cnf 42 "+ msg + "\r\n");
  clearLoraSerial();
  loraSerial.print("mac tx cnf 42 "+ msg + "\r\n");

  //Verify send transaction
  String resp = readLoraString();
  if (resp.startsWith("ok")) {
    loraSerial.setTimeout(30000); // Send of the packet takes some time...
    String resp2 = readLoraString();
    loraSerial.setTimeout(2000); // Set the timeout back
    if (resp2.startsWith("mac_tx_ok") || resp2.startsWith("mac_rx")) {
      Serial.print("Received the ack"); //OK
    } else {
      Serial.print("Send received "+ resp2);
    }
  } else {
    Serial.print("Send did not ended with OK.");
  }

  clearLoraSerial();
}

String getData(int airPollution, float temperature, float humidity, int battery) {
  int temperatureInt = (int)(temperature * 10);
  int humidityInt = (int)(humidity * 10);

  String airPollutionStr = dec2Hex(airPollution);
  String temperatureStr = dec2Hex(temperatureInt);
  String humidityStr = dec2Hex(humidityInt);
  String batteryStr = dec2Hex(battery);
  
  return airPollutionStr + temperatureStr + humidityStr + batteryStr;
}

//assumption that the int is 16bits
String dec2Hex(int num) {
  String hex = String(num, HEX);
  int zeros = 4 - hex.length();
  for (int i = 0; i < zeros; i++) {
    hex = "0" + hex;
  }
  return hex;
}

boolean establishLora() {
  //signal that it is not initialized
  digitalWrite(redLedPin, HIGH); //light the red led
  digitalWrite(greenLedPin, HIGH); //light the red led
  
  clearLoraSerial();
  delay(1000);
  
  loraSerial.print("mac join abp\r\n");
  Serial.print("mac join abp\r\n");
  
  String resp = readLoraString(); // ok
  resp = readLoraString(); // accepted

  clearLoraSerial();

  if (resp.startsWith("accepted")) {
    digitalWrite(redLedPin, LOW); //light the red led
    return true;
  } else {
    digitalWrite(greenLedPin, LOW); //light the red led
    return false;
  }
}

void clearLoraSerial() {
   //clear serial buffer
  while(loraSerial.available())
    loraSerial.read();
}

String readLoraString() {
  String data = loraSerial.readStringUntil('\n');

  //send it to the console
  Serial.println(data);

  
  if (! data.endsWith("\r")) {
    Serial.println("ERROR, the string [" + data + "] did not contain the \\r\\n at the end.");
    return data;
  }

  return data.substring(0, data.length() - 1);
}

int getStatus() {
  Serial.println("Getting the LoRa module status");
  clearLoraSerial();
  loraSerial.print("mac get status\r\n");
  String data = readLoraString();
  long res = strtol(data.c_str(), 0, 16);
  Serial.println("LoRa status: "+ data);
  clearLoraSerial();
  return res;
}

