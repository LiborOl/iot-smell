#include <SoftwareSerial.h>

SoftwareSerial loraSerial(10, 11); // RX, TX

int redLedPin = 13;
int greenLedPin = 3;

void setup() {
  pinMode(redLedPin, OUTPUT); //red led out
  pinMode(greenLedPin, OUTPUT); //green led out

  //signal that it is not initialized
  digitalWrite(redLedPin, HIGH); //light the red led
  digitalWrite(greenLedPin, LOW); //light the red led
  
  randomSeed(analogRead(0));
  
  // start serial port at 57600 bps and wait for port to open:
  Serial.begin(57600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  };

  loraSerial.begin(57600);

  //join the LoRa
  establishLora();

  digitalWrite(redLedPin, LOW); //light the red led
  digitalWrite(greenLedPin, HIGH); //light the red led
}

void loop() {
  int airPollution = 120 + (random(100) - 50); // 120 +- 50
  float temperature = 28.65 + (random(20) - 10); // 28.65 +- 10
  float humidity = 500 + random(300); // 500 - 800
  int battery = 0x80ff + (random(100) - 50); // +- 50

  //Transform the data into HEXa String
  String data = getData(airPollution, temperature, humidity, battery);

  //Send
  Serial.print("mac tx cnf 42 "+ data + "\r\n");
  loraSerial.print("mac tx cnf 42 "+ data + "\r\n");

  //Verify send transaction
  String resp = readLoraString();
  if (resp.startsWith("ok")) {
    loraSerial.setTimeout(30000);
    String resp2 = readLoraString();
    loraSerial.setTimeout(2000);
    if (resp.startsWith("mac_tx_ok")) {
      //OK
    } else {
      Serial.print("Send received "+ resp2);
    }
  } else {
    Serial.print("Send did not ended with OK.");
  }

  clearLoraSerial();

  delay(30000);
}

void send(String msg) {
  Serial.print("mac tx cnf 42 "+ msg + "\r\n");
  loraSerial.print("mac tx cnf 42 "+ msg + "\r\n");

  //Verify send transaction
  String resp = readLoraString();
  if (resp.startsWith("ok")) {
    loraSerial.setTimeout(30000);
    String resp2 = readLoraString();
    loraSerial.setTimeout(2000);
    if (resp.startsWith("mac_tx_ok")) {
      //OK
    } else if (resp.startsWith("mac_rx")) {
      //OK
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
  
  //Serial.print("Pollution: ");
  //Serial.print(airPollution);
  //Serial.print("; ");
  //Serial.print("Temperature: ");
  //Serial.print(temperature);
  //Serial.print("; ");
  //Serial.print("Humidity: ");
  //Serial.print(humidity);
  //Serial.print("; ");
  
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
  clearLoraSerial();
  
  loraSerial.print("mac join abp\r\n");
  Serial.print("mac join abp\r\n");
  
  String resp = readLoraString(); // ok
  resp = readLoraString(); // accepted

  clearLoraSerial();

  if (resp.startsWith("accepted")) {
    return true;
  } else {
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
    Serial.println("ERROR");
  }

  //clearLoraSerial();
  return data.substring(0, data.length() - 1);
}

