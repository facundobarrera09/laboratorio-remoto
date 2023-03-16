#include "ArduinoJson.h"
#include "Mensaje.h"
#include "Conexion.h"

#define CANTIDAD_MUESTRAS 10
#define MESSAGE_DELAY 500
#define DELAY_RELES 2000

// Pines de salida
const int rele_vsin = 23;
const int rele_r1 = 22;
const int rele_c = 5;
const int rele_l = 4;
const int rele_r2 = 2;

const boolean SIMULAR_VALORES = false;

// Pines de lectura
const int read_1 = 33; // voltage
const int read_2 = 32; // corriente

// Conexion con servidor
#define MEDICIONES_KEEPALIVE 15

#define C_DATA_VOLTAJE 201
#define C_DATA_CORRIENTE 202

Conexion conexion;

// Json Config
StaticJsonDocument<JSON_OBJECT_SIZE(24)> configDoc;

void setupConfig(String jsonConfig);
int simularVoltaje(int x);
int simularCorriente(int x);

void setup() {
  Serial.begin(115200);

  conexion = Conexion();

  pinMode(rele_vsin, OUTPUT);
  pinMode(rele_r1, OUTPUT);
  pinMode(rele_c, OUTPUT);
  pinMode(rele_l, OUTPUT);
  pinMode(rele_r2, OUTPUT);
  pinMode(read_1, INPUT);
  pinMode(read_2, INPUT);
}

void loop() {  
  Mensaje respuesta;

  conexion.establecerConexion();
  
  if (conexion.getEstado() == CONNECTED) {
    // Esperar configuracion
    respuesta = Mensaje();
    conexion.enviarMensaje(Mensaje(T_INFORMATION|T_BLOCKING, C_CONFIGINFORMATION, "AWAITING INFORMATION"));
    
    // Establecer configuracion   
    if (conexion.esperarMensaje(&respuesta, LONGWAIT) == 0) {
      setupConfig(respuesta.getMensaje());
    }
    else {
      conexion.abortarConexion(); 
    }

  }

  while (conexion.getEstado() == CONNECTED) {
    // Realizar mediciones y enviarlas al servidor
    for (int mediciones = 0; mediciones < MEDICIONES_KEEPALIVE; mediciones++) {
      int voltaje[CANTIDAD_MUESTRAS] = {};
      int corriente[CANTIDAD_MUESTRAS] = {};
      
      for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
        if (SIMULAR_VALORES) {
          voltaje[x] = simularVoltaje(x);
          corriente[x] = simularCorriente(x);
        }
        else {
          voltaje[x] = analogRead(read_1);
          corriente[x] = analogRead(read_2);
        }
      }
      
      String datos = "VOLTAGE:";
      for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
        if (x != 0) datos += ",";
        datos += String(voltaje[x]);
      }
      datos += "CURRENT:";
      for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
        if (x != 0) datos += ",";
        datos += String(corriente[x]);
      }
      
      conexion.enviarMensaje(Mensaje(T_INFORMATION|T_NONBLOCKING, C_DATA, datos));

      if (conexion.hayMensajeDisponible()){
        respuesta = Mensaje();
        if (conexion.recibirMensaje(&respuesta) == 0) {
          if (respuesta.getIdentificador() == C_CONFIGINFORMATION) {
            setupConfig(respuesta.getMensaje());            
          }
        }
      }
    }

    // Verificar que la conexion siga viva
    conexion.keepAlive();
  }
}

void setupConfig(String incommingJson) {
  DeserializationError err = deserializeJson(configDoc, incommingJson);
  boolean vsin = false, r1 = false, c = false, l = false, r2 = false;

  if (err) {
    String error = "ERROR: deserializeJson() failed with code " + String(err.f_str()) + ", and payload: " + incommingJson;
    conexion.enviarMensaje(Mensaje(T_INFORMATION|T_NONBLOCKING, C_CONFIGINFORMATION, error));
  }
  else {
    vsin = (boolean) configDoc["rele1"];
    r1 = (boolean) configDoc["rele2"];
    c = (boolean) configDoc["rele3"];
    l = (boolean) configDoc["rele4"];
    r2 = (boolean) configDoc["rele5"];

    //Serial.print("4: vsin=");
    //Serial.print(vsin);
    //Serial.print(", r1=");
    //Serial.print(r1);
    //Serial.print(", c=");
    //Serial.print(c);
    //Serial.print(", l=");
    //Serial.print(l);
    //Serial.print(", r2=");
    //Serial.println(r2);
  }
  
  if (vsin) {
      // Desconectar el circuito y esperar
      digitalWrite(rele_vsin, LOW);
      delay(DELAY_RELES);

      // Realizar los cambios en el circuito
      digitalWrite(rele_r1, (r1) ? HIGH : LOW);
      digitalWrite(rele_c, (c) ? HIGH : LOW);
      digitalWrite(rele_l, (l) ? HIGH : LOW);
      digitalWrite(rele_r2, (r2) ? HIGH : LOW);

      // Esperar y encender el circuito
      delay(DELAY_RELES);
      digitalWrite(rele_vsin, HIGH);
    }
    else {
      digitalWrite(rele_vsin, LOW);
    }
}

int simularVoltaje(int x) {
  return 100 * sin( ((2*PI*x)/100) + (PI*1.2) );
}

int simularCorriente(int x) {
  return 100 * sin( (2*PI*x)/100 );
}
