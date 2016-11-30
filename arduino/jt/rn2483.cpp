/*
 * A library for communicating wity the Microchip RN2483 LoRa module.
 * Inspired by the JP Meijers and Nicolas Schteinschraber rn2xx3 library
 * (see https://github.com/jpmeijers/RN2483-Arduino-Library).
 *
 * @Author JT
 * @Date 11/27/2016
 *
 */

#include "rn2483.h"

extern "C" {
#include <string.h>
#include <stdlib.h>
}

#define NEWLINE "\r\n"
#define RESP_TIMEOUT 2000
#define TX_TIMEOUT 30000
#define SAVE_TIMEOUT 30000
#define RETRY_DELAY 1000


/*
  @param serial Opened Stream (software/hardware serial)
*/
rn2483::rn2483(Stream& serial):_serial(serial) {
  _serial.setTimeout(RESP_TIMEOUT);
}

void rn2483::autobaud() {
  while (true)   {
    _serial.print("\x00\x55" NEWLINE "sys get ver" NEWLINE);
    if (readResponse() != "") return;
    delay(RETRY_DELAY);
  }
}

String rn2483::hweui() {
  flushInput();
  _serial.print("sys get hweui" NEWLINE);
  String eui = readResponse();
  eui.trim();
  return eui;
}

bool rn2483::join() {
  if(_otaa) {
    _serial.setTimeout(SAVE_TIMEOUT);
    
    bool joined = false;
    for(int i=0; i<2; i++) {
      _serial.print("mac join otaa" NEWLINE);
      readResponse();
      String resp = readResponse();
  
      if(resp.startsWith("accepted")) {
        joined = true;
        break;
      }
      
      delay(RETRY_DELAY);
    }
    _serial.setTimeout(RESP_TIMEOUT);
    return joined;      
  } else if (_abp) {
    _serial.setTimeout(SAVE_TIMEOUT);
    
    _serial.print("mac join abp" NEWLINE);
    readResponse();
    String resp = readResponse();
    _serial.setTimeout(RESP_TIMEOUT);
      
    return resp.startsWith("accepted");
  }
}

void rn2483::reset() {
  delay(100);
  flushInput();
  _serial.print("mac reset 868" NEWLINE);
  readResponse();
}

void rn2483::setupOTAA(String appEUI, String appKey) {
  _otaa = true;
  
  flushInput();

  _serial.print("mac set appeui " + appEUI);
  _serial.print(NEWLINE);
  readResponse();
  _serial.print("mac set appkey " + appKey);
  _serial.print(NEWLINE);
  readResponse();
  
  _serial.print("mac set adr off" NEWLINE);
  readResponse();
  _serial.print("mac set pwridx 1" NEWLINE);
  readResponse();

  _serial.setTimeout(SAVE_TIMEOUT);
  _serial.print("mac save" NEWLINE);
  readResponse();
  _serial.setTimeout(RESP_TIMEOUT);  
}

void rn2483::setupABP(String devAddr, String appSKey, String nwkSKey) {
  _abp = true;

  flushInput();
    
  _serial.print("mac set nwkskey " + nwkSKey);
  _serial.print(NEWLINE);
  readResponse();
  _serial.print("mac set appskey " + appSKey);
  _serial.print(NEWLINE);
  readResponse();
  _serial.print("mac set devaddr " + devAddr);
  _serial.print(NEWLINE);
  readResponse();

  _serial.print("mac set adr off" NEWLINE);
  readResponse();
  _serial.print("mac set ar off" NEWLINE);
  readResponse();
  _serial.print("mac set pwridx 1" NEWLINE);  
  readResponse();
  _serial.print("mac set dr 2" NEWLINE); 
  readResponse();

  _serial.setTimeout(SAVE_TIMEOUT);
  _serial.print("mac save" NEWLINE);
  readResponse();
  _serial.setTimeout(RESP_TIMEOUT);
} 

bool rn2483::txCnf(String data) {
  return txCmd("mac tx cnf 1 ", data);
}

bool rn2483::txUncnf(String data) {
  return txCmd("mac tx uncnf 1 ", data);
}

bool rn2483::txCmd(String command, String data) {
  bool sendSuccess = false;
  uint8_t busyCount = 10;
  uint8_t retryCount = 10;

  flushInput();

  while(retryCount-- >0) {
    _serial.print(command);
    _serial.print(data);
    _serial.print(NEWLINE);
    String resp = readResponse();

    if(resp.startsWith("ok")) {
      _serial.setTimeout(TX_TIMEOUT);
      resp = readResponse();
      _serial.setTimeout(RESP_TIMEOUT);
        Serial.print(resp);
      if(resp.startsWith("mac_tx_ok") || resp.startsWith("radio_tx_ok")) {
        return true;
      } else if (resp.startsWith("mac_rx")) {
        // TODO: receive downlink data - how does it look in the CRA network?
        return true;
      } else if (resp.startsWith("mac_err") || resp.startsWith("radio_err")) {
        reset();
        join();
      } else if (resp.startsWith("invalid_data_len")) {
        return false;
      } else {
        // unknown response
        //reset();
        //join();
      }
    } else if(resp.startsWith("not_joined") || resp.startsWith("frame_counter_err_rejoin_needed") 
        || resp.startsWith("mac_paused") || resp.startsWith("silent")) {
      reset();
      join();
    } else if(resp.startsWith("invalid_param") || resp.startsWith("invalid_data_len") 
        || resp.startsWith("no_free_ch")) {
      return false;
    } else if(resp.startsWith("busy")) {
      if(busyCount-- >0) {
        delay(RETRY_DELAY);
      } else {
        reset();
        join();
      }
    } else {
      // unknown response after mac tx command
      reset();
      join();
    }
  }
  return false;
}

void rn2483::setDR(int dr) {
  flushInput();
  _serial.print("mac set dr " + dr);
  _serial.print(NEWLINE);
  readResponse();
}

void rn2483::sleep(long msec) {
  _serial.print("sys sleep " + msec);
  _serial.print(NEWLINE);
}

void rn2483::flushInput() {
  while(_serial.available())
    _serial.read();
}

String rn2483::readResponse() {
  return _serial.readStringUntil('\n');
}


