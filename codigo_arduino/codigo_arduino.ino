#include "ArduinoJson.h"

#define CANTIDAD_MUESTRAS 500
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

// Servidor
const String PASSWORD = "CONNECT:1234";
int estado_conexion = 0; // 0 - desconectado, 1 - esperando mensaje del servidor, 2 - enviando mediciones al servidor
String mensaje = "";

// Json Config
StaticJsonDocument<JSON_OBJECT_SIZE(24)> configDoc;

void setupConfig(String jsonConfig);
int simularVoltaje(int x);
int simularCorriente(int x);

void setup() {
  Serial.begin(115200);
  pinMode(rele_vsin, OUTPUT);
  pinMode(rele_r1, OUTPUT);
  pinMode(rele_c, OUTPUT);
  pinMode(rele_l, OUTPUT);
  pinMode(rele_r2, OUTPUT);
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
    
    Serial.print("2VOLTAGE:");
    for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
      if (x != 0) Serial.print(',');
      Serial.print(voltaje[x]);
    }
    Serial.print("CURRENT:");
    for (int x = 0; x < CANTIDAD_MUESTRAS; x++) {
      if (x != 0) Serial.print(',');
      Serial.print(corriente[x]);
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
    boolean vsin, r1, c, l, r2;
    
    vsin = (boolean) configDoc["rele1"];
    r1 = (boolean) configDoc["rele2"];
    c = (boolean) configDoc["rele3"];
    l = (boolean) configDoc["rele4"];
    r2 = (boolean) configDoc["rele5"];

    Serial.print("4: vsin=");
    Serial.print(vsin);
    Serial.print(", r1=");
    Serial.print(r1);
    Serial.print(", c=");
    Serial.print(c);
    Serial.print(", l=");
    Serial.print(l);
    Serial.print(", r2=");
    Serial.println(r2);

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
}

int simularVoltaje(int x) {
  return 100 * sin( ((2*PI*x)/100) + (PI*1.2) );
}

int simularCorriente(int x) {
  return 100 * sin( (2*PI*x)/100 );
}
