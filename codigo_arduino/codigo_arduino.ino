#include "/home/facundo/repos/laboratorio-remoto/codigo_arduino/ArduinoJson.h"

#define elementos 500
#define MESSAGE_DELAY 3000

// Led de debug
const int led_1 = 2;
const int led_2 = 3;
const int read_1 = A0;

int tension[elementos] = {
};

// Servidor
const String PASSWORD = "CONNECT:1234";
int estado_conexion = 0; // 0 - desconectado, 1 - esperando mensaje del servidor, 2 - enviando mediciones al servidor
String mensaje = "";

// Json Config
const int capacity = JSON_OBJECT_SIZE(5); // Un objeto con n elementos
StaticJsonDocument<capacity> configDoc;

void setupConfig(String jsonConfig);

void setup() {
  Serial.begin(115200);
  pinMode(led_1, OUTPUT);
  pinMode(led_2, OUTPUT);
  pinMode(read_1, INPUT);
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
      digitalWrite(led_1, HIGH);
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
    digitalWrite(led_2, HIGH);
    
    setupConfig(mensaje);
  }

  // Enviar mediciones al servidor
  if (estado_conexion == 2) {
    int ADC1 = analogRead(read_1);
    Serial.print("2");
    Serial.println(ADC1);

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
    Serial.print("RECEIVED_VALID_CONFIG - ");
    Serial.println((boolean)configDoc["rele1"]);
  }
}
