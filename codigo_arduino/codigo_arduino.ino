#define elementos 500
#define MESSAGE_DELAY 3000

const int pot_pin1 = 34;
const int pin_led = 25;

// Led de debug
const int led_0 = 2;
const int led_1 = 3;

int ADC1 = 0;

int tension[elementos] = {
};
int corriente[elementos] = {
};

// Servidor
const String PASSWORD = "connect:1234";
int estado_conexion = 0; // 0 - desconectado, 1 - esperando mensaje del servidor, 2 - enviando mediciones al servidor
String mensaje = "";
String uno = "1";

void setup() {
  Serial.begin(115200);
  pinMode(pin_led, OUTPUT);
  pinMode(led_0, OUTPUT);
  pinMode(led_1, OUTPUT);
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
      digitalWrite(led_0, HIGH);
    }
  }

  // Manejar estados de la conexion
  if (estado_conexion == 1){
    while (Serial.available() < 10) { 
      Serial.println("1AWAITING_CONFIG"); 
      delay(MESSAGE_DELAY); 
    }
    mensaje = Serial.readString();
    delay(MESSAGE_DELAY);
    Serial.println("0RECEIVED_CONFIG");
    uno = "1";
    uno.concat(mensaje);
    Serial.println(uno);
    estado_conexion = 2;
    digitalWrite(led_1, HIGH);
  }

  // Enviar mediciones al servidor
  if (estado_conexion == 2) {
    ADC1 = analogRead(pot_pin1);
    Serial.print("2");
    Serial.println(ADC1);

    if (Serial.available() > 0)
      estado_conexion = 1;
  }
}

