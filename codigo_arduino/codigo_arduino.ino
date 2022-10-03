#include "ArduinoJson.h"

#define CANTIDAD_MUESTRAS 500
#define MESSAGE_DELAY 1000

// Led de debug
const int led_1 = 12;
const int led_2 = 13;

const boolean SIMULAR_VALORES = true;

// Pines de lectura
const int read_1 = 35;
const int read_2 = 34;

//int voltaje[CANTIDAD_MUESTRAS];
//int intensidad[CANTIDAD_MUESTRAS];

// Servidor
const String PASSWORD = "CONNECT:1234";
int estado_conexion = 0; // 0 - desconectado, 1 - esperando mensaje del servidor, 2 - enviando mediciones al servidor
String mensaje = "";

// Json Config
StaticJsonDocument<JSON_OBJECT_SIZE(7)> configDoc;

void setupConfig(String jsonConfig);
int simularVoltaje(int x);
int simularIntensidad(int x);

void setup() {
  Serial.begin(115200);
  pinMode(led_1, OUTPUT);
  pinMode(led_2, OUTPUT);
  pinMode(read_1, INPUT);
  pinMode(read_2, INPUT);
}

void loop() {  
  // Establecer conexion con servidor
  if (estado_conexion == 0) {
    while (Serial.available() < 1) {
      Serial.println("1AWAITING_CONNECTION"); 
      delay(MESSAGE_DELAY); 
    }
    mensaje = Serial.readString();
    if (mensaje == PASSWORD) {
      Serial.println("0RECEIVED_CONNECTION");
      estado_conexion = 1;
    }
  }

  // Manejar estados de la conexion
  if (estado_conexion == 1){
    while (Serial.available() < 1) { 
      Serial.println("1AWAITING_CONFIG"); 
      delay(MESSAGE_DELAY);
    }
    mensaje = Serial.readString();
    Serial.println("0RECEIVED_CONFIG");
    estado_conexion = 2;
    
    setupConfig(mensaje);
  }

  // Realizar mediciones y enviarlas al servidor
  if (estado_conexion == 2) {
    int voltaje[CANTIDAD_MUESTRAS] = {};
    int intensidad[CANTIDAD_MUESTRAS] = {};
    
    for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
      if (SIMULAR_VALORES) {
        voltaje[x] = simularVoltaje(x);
        intensidad[x] = simularIntensidad(x);
      }
      else {
        voltaje[x] = analogRead(read_1);
        intensidad[x] = analogRead(read_2);
      }
    }
    
    Serial.print("2VOLTAGE:");
    for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
      if (x != 0) Serial.print(',');
      Serial.print(voltaje[x]);
    }
    Serial.print("INTENSITY:");
    for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
      if (x != 0) Serial.print(',');
      Serial.print(intensidad[x]);
    }
    Serial.println("");

    if (Serial.available() > 0)
      estado_conexion = 1;
  }
}

void setupConfig(String incommingJson) {
  DeserializationError err = deserializeJson(configDoc, incommingJson);
  if (err) {
    Serial.print("1");
    Serial.print("deserializeJson() failed with code ");
    Serial.println(err.f_str());
  }
  else {
    Serial.print("0");
    Serial.println("RECEIVED_VALID_CONFIG");
    digitalWrite(led_1, (boolean) configDoc["rele1"]);
    digitalWrite(led_2, (boolean) configDoc["rele2"]);
  }
}

int simularVoltaje(int x) {
  return 100 * sin( ((2*PI*x)/100) + (PI*1.2) );
}

int simularIntensidad(int x) {
  return 100 * sin( (2*PI*x)/100 );
}
