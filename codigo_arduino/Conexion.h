#pragma once

#include "Mensaje.h"

#define DEFAULTKEEPALIVE 4000
#define INITIALDELAY 500
#define KEEPALIVEDELAY 1000

// CONNECTION STATES
#define ERROR -1
#define NOTCONNECTED 0
#define CONNECTED 1
#define RECONNECTING 2

class Conexion {
  private:
    int estado = NOTCONNECTED;
    boolean reconexion = false;
    int tiempoKeepAlive = DEFAULTKEEPALIVE;

    Mensaje mensajeBloqueante;

    int debug = false;

    void _resetearMensajeBloqueante() {
      mensajeBloqueante = Mensaje();
    }

    void _log(String log) {
      if (debug) Serial.println("DEBUG: "+log);
    }

  public:
    Conexion(boolean iniciar, boolean reconexion) {
      this->reconexion = reconexion;

      if (iniciar) {
        establecerConexion();
      }
      _resetearMensajeBloqueante();
    }
    Conexion(boolean iniciar) : Conexion(iniciar, false) {}
    Conexion() : Conexion(false, false) {}

    int establecerConexion() {
      if (estado == NOTCONNECTED || estado == RECONNECTING) {
        Mensaje respuesta = Mensaje();
        while(estado != CONNECTED){
          while(recibirMensaje(&respuesta) != 0) {
            enviarMensaje(Mensaje(T_INFORMATION|T_NONBLOCKING, C_BEGINCONNECTION, "AWAITING CONNECTION"));
            delay(INITIALDELAY);
          }
          if (respuesta == Mensaje(T_INFORMATION|T_BLOCKING, C_BEGINCONNECTION, "ACCEPT CONNECTION")) {
            estado = CONNECTED;
          }
        }
      }
      else { 
        return ERROR;
      }
      return estado;
    }

    void abortarConexion() {
      _resetearMensajeBloqueante();

      if (reconexion) {
        estado = RECONNECTING;
        establecerConexion();
      }
      else
        estado = NOTCONNECTED;
    }
    
    boolean keepAlive() {
      bool conexionViva = false;
      Mensaje respuesta = Mensaje();

      enviarMensaje(Mensaje(T_INFORMATION|T_BLOCKING, C_KEEPALIVE, "AWAITING RESPONSE"));
      _log("keepAlive(): mensajeBloqueante: "+mensajeBloqueante.toString());
      if (esperarMensaje(&respuesta) == 0) {
        conexionViva = true;
      }
      else {
        conexionViva = false;
        abortarConexion();
      }

      return conexionViva;
    }

    int enviarMensaje(Mensaje mensaje) {
      int estadoEnvio = 0;

      if (mensaje.getTipo() == T_INFORMATION|T_BLOCKING) { 
        if (mensajeBloqueante == Mensaje()) {
          mensajeBloqueante = mensaje;
        }
        else if (mensaje != mensajeBloqueante) {
          estadoEnvio = -1;
        }
      }
      
      if (estadoEnvio == 0) Serial.println(mensaje.toString());

      return estadoEnvio;
    }

    int reenviarUltimoMensaje() {
      enviarMensaje(mensajeBloqueante);
    }

    int recibirMensaje(Mensaje *mensaje) {
      int estadoRecepcion = 0;
    
      if (hayMensajeDisponible()) { 
        String cadena = Serial.readString();
        
        mensaje->setTipo((cadena.substring(0,1)).toInt());
        mensaje->setIdentificador((cadena.substring(1,4)).toInt());
        mensaje->setMensaje(cadena.substring(4));

        _log("recibirMensaje(): Received: "+cadena+"; Mensaje: "+mensaje->toString());

        if (mensajeBloqueante != Mensaje()) {
          _log("Comparing: "+mensaje->toString()+" and "+mensajeBloqueante.toString());
          if (mensaje->getTipo() == (T_ACK|T_NONBLOCKING) && mensaje->getIdentificador() == mensajeBloqueante.getIdentificador()) {
            _resetearMensajeBloqueante();
            _log("Comparison was true");
          }
          else {
            estadoRecepcion = 1;
          }
        }

        if (mensaje->getTipo() == (T_INFORMATION|T_BLOCKING)) {
          enviarMensaje(Mensaje(T_ACK|T_NONBLOCKING, mensaje->getIdentificador(), "RECEIVED"));          
        }
      }
      else {
        estadoRecepcion = -1;
      }

      return estadoRecepcion;
    }

    int esperarMensaje(Mensaje *mensaje, int tiempo) {
      int estadoRecepcion = -1;

      if (estado == CONNECTED){
        do {
          if (recibirMensaje(mensaje) != 0) {
            delay((tiempo > 0) ? tiempo : 0);
            tiempo -= INITIALDELAY;
            reenviarUltimoMensaje();
          }
          else {
            estadoRecepcion = 0;
          }

        } while (estadoRecepcion != 0 && tiempo > 0);
      }
      else
        estadoRecepcion = -1;

      return estadoRecepcion;
    }
    
    int esperarMensaje(Mensaje *mensaje) {
      return esperarMensaje(mensaje, this->tiempoKeepAlive);
    }

    int hayMensajeDisponible() {
      if (Serial.available() > 0)
        return true;
      else
        return false;
    }

    int getEstado() {
      return this->estado;
    }
};
