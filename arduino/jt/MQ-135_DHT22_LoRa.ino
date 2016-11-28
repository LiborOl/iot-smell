// Temperature and humidity sensing (1/10th C, 1/10 %RH resolution) using the DHT22 digital sensor
// Air quality sensing (uncalibrated) using the analog MQ-135 air quality sensor (NH3, NOx, alcohol, Benzene, smoke, CO2)
// Battery voltage sensing (mV) - the divider callibrated to get millivolts = ADC_output * 4 (0..4092 mV range)
// No tamper detection logic yet
// RN2483 minimal library
// Refactored, untested!

#include "DHT.h"
#include "rn2483.h"
#include <SoftwareSerial.h>

#define APPS_KEY "DEADBEEF000000000000000000000001"
#define NWKS_KEY "DEADBEEF000000000000000000000000"

#define BAT_PIN 1       // Battery voltage/4 analog input

#define AQ_PWR_PIN 7    // 0 to power on
#define AQ_PIN 0        // Analog input
 
#define DHT_PIN 2       // DHT22 temperature/humidity sensor pin
#define DHT_TYPE DHT22  // DHT 22  (AM2302)

#define ERR_LED 5       // red LED pin = error
#define LORA_OK_LED 6   // blue LED pin = LoRa working, transmitting

DHT dht(DHT_PIN, DHT_TYPE);

SoftwareSerial loraSerial(10, 11); // RX, TX
rn2483 myLora(loraSerial);


int aQValue;

void setup() {
  Serial.begin(57600);

  pinMode(ERR_LED | LORA_OK_LED | AQ_PWR_PIN, OUTPUT);
  digitalWrite(AQ_PWR_PIN, LOW); 

  // blink LEDs to indicate reset
  digitalWrite(ERR_LED, HIGH); 
  digitalWrite(LORA_OK_LED, HIGH);   
  delay(500);
  digitalWrite(ERR_LED, LOW); 
  digitalWrite(LORA_OK_LED, LOW);   
  
  analogReference(INTERNAL);
  dht.begin();

  initializeRadio();
//  while (!Serial) {
//    ; // wait for serial port to connect. Needed for native USB port only
//  }
}


void initializeRadio() {
  loraSerial.begin(57600);
  myLora.reset();
  String addr = myLora.hweui(); // TODO: "sys get hweui" or "mac get deveui" ?
  myLora.setupABP(addr.substring(8), APPS_KEY, NWKS_KEY);
  
  bool joinResult = myLora.join(); 
  while(!joinResult) {
    digitalWrite(ERR_LED, HIGH); 
    delay(5000); //delay before retry
    joinResult = myLora.join();
    digitalWrite(ERR_LED, LOW); 
  }
  digitalWrite(LORA_OK_LED, HIGH);   
}


void loop() {
  // start heating the AQ meter
  digitalWrite(AQ_PWR_PIN, LOW); 
  Serial.println("Sensor heating...");
  delay(40000);  // TODO: Sleep both Arduino and LoRa module
  
  // reading temperature or humidity takes about 250 milliseconds
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // check if any reads failed and try again
  if (isnan(h) || isnan(t)) {
    // TODO: read again
  }

  // read battery voltage
  int batteryVoltage = analogRead(BAT_PIN) * 4;

  // Read AQ and shut down the sensor
  aQValue = analogRead(AQ_PIN);       
  digitalWrite(AQ_PWR_PIN, HIGH);

  // Send data over LoRa
  digitalWrite(LORA_OK_LED, HIGH);
  String out = getData(aQValue, t, h, batteryVoltage);
  Serial.println("Sending: "+out);   
  myLora.txUncnf(out);
  digitalWrite(LORA_OK_LED, LOW);

  // sleep until next measurement
  delay(120000); // TODO: Sleep both Arduino and LoRa module                      
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





