#pragma once
#include "Mensaje.h"

#define MAXKEEPALIVE 5000
#define DELAYINICIO 500

class Conexion {
  private:
    int estado = 0;
    int keepAliveMax = MAXKEEPALIVE;

  public:
    Conexion(boolean iniciar) {
      if (iniciar) {
        iniciarConexion();
      }
    }
    Conexion() : Conexion(false) {}

    int iniciarConexion() {
      if (estado == 0 || estado == 2) {
        Mensaje respuesta = Mensaje();
        while(recibirMensaje(&respuesta) == -1) {
          enviarMensaje(Mensaje(1, 111, "AWAITING CONNECTION"));
          delay(DELAYINICIO);
        }
        Serial.println("CONEXION EXITOSA");
      }
      else { 
        return -1;
      }
      return estado;
    }

    int enviarMensaje(Mensaje mensaje) {
      Serial.println(mensaje.toString());
      return 0;
    }

    int recibirMensaje(Mensaje *mensaje) {
      if (Serial.available() < 1) { 
        String cadena = Serial.readString();
        
        mensaje->setTipo((cadena.substring(0,1)).toInt());
        mensaje->setIdentificador((cadena.substring(1,4)).toInt());
        mensaje->setMensaje(cadena.substring(4));
      }
      else {
        return -1;
      }
      return 0;
    }
};
