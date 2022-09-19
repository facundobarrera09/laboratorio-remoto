#include <cstring>

#define elementos 500
const int pot_pin1 = 34;
const int pin_led = 25;

int ADC1 = 0;

int tension[elementos] = {};
int corriente[elementos] = {};

// Servidor
const String PASSWORD = "connect:1234";
int estado_conexion = 0; // 0 - desconectado, 1 - esperando mensaje del servidor, 2 - enviando mediciones al servidor
String mensaje = "";

void setup() {
  Serial.begin(115200);
  pinMode(pin_led, OUTPUT);
}

void loop() {
  // Establecer conexion con servidor
  while (!estado_conexion) {
    while (Serial.available() == 0) {}
    mensaje = Serial.readString();
    if (mensaje == PASSWORD) {
      Serial.println("0RECEIVED");
      estado_conexion = 1;
      break;
    }
  }

  // Manejar estados de la conexion
  if (estado_conexion == 1){
    while (Serial.available() < 10) {}
    mensaje = Serial.readString();
    Serial.write("0RECEIVED_CONFIG");
    Serial.write("1".concat(mensaje));
  }

    // Enviar mediciones al servidor
  if (estado_conexion == 2) {
    ADC1 = analogRead(pot_pin1);
    Serial.print("2");
    Serial.println(ADC1);

    if (Serial.avaliable() > 0)
      estado_conexion = 1;
  }
}
