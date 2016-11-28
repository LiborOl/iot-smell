/*
 * A library for communicating wity the Microchip RN2483 LoRa module.
 * Inspired by the JP Meijers and Nicolas Schteinschraber rn2xx3 library 
 * (see https://github.com/jpmeijers/RN2483-Arduino-Library).
 *
 * @Author JT
 * @Date 11/27/2016
 *
 */
 
#ifndef rn2483_h
#define rn2483_h

#include "Arduino.h"

class rn2483 {
  public:

    /*
     * A constructor with a Stream ({Software/Hardware}Serial) parameter.
     */
    rn2483(Stream& serial);

    /*
     * Transmit the correct sequence to the rn2483 to trigger its autobauding feature.
     * After this operation the rn2483 should communicate at the same baud rate than us.
     */
    void autobaud();
    
    /*
     * Reset the module.
     */
    void reset();    

    /*
     * Get the hardware EUI of the module, so that we can register it in the network.
     * You have to have a working serial connection to the module before calling this function.
     * In other words you have to at least call autobaud() before this function.
     */
    String hweui();
        
    /*
     * Initialise the module using fixed setup.
     *
     * addr: The device address as a HEX string. Example "01234567", last 8 digits of EUI
     * appSKey: Application Session Key as a HEX string. Example "00112233445566778899AABBCCDDEEFF"
     * nwkSKey: Network Session Key as a HEX string. Example "00112233445566778899AABBCCDDEEFF"
     */
    void setupABP(String addr, String appSKey, String nwkSKey);

    /*
     * Initialise the module using over the air activation.
     *
     * appEUI: Application EUI as a HEX string. Example "0123456789ABCDEF"
     * appKey: Apllication key as a HEX string. Example "00112233445566778899AABBCCDDEEFF"
     */
    void setupOTAA(String appEUI, String appKey);

    /*
     * Join the LoRa network, call after setupXXX.
     */
    bool join();
    
    /*
     * Confirmed transmission via LoRa WAN.
     *
     * Parameter is a HEX string.
     */
    bool txCnf(String);

    /*
     * Unconfirmed transmission via LoRa WAN.
     *
     * Parameter is a HEX string.
     */
    bool txUncnf(String);


    /*
     * Change the datarate at which the rn2483 transmits.
     * A value of between 0 and 5 can be specified.
     * This can be overwritten by the network when using OTAA, 
     * so to force a datarate, call this function after join().
     */
    void setDR(int dr);

    /*
     * Put the rn2483 to sleep for a specified time.
     * The rn2483 accepts values from 100 to 4294967296.
     */
    void sleep(long msec);
   

  private:
    Stream& _serial;
    
    bool _otaa = false;
    bool _abp = false;

    bool txCmd(String, String);
    void flushInput();
    String readResponse();

};

#endif
