#pragma once

// TYPES - left bit is Information (0) or ACK (1), and right bit is blocking (0) or nonblocking (1)
#define T_INFORMATION 0
#define T_ACK 1
#define T_BLOCKING 0
#define T_NONBLOCKING 2

// IDENTIFIERS
#define C_BEGINCONNECTION 100
#define C_CONFIGINFORMATION 101
#define C_KEEPALIVE 102
#define C_DATA 200

class Mensaje {
  private:
    int tipo = -1;
    int identificador = -1;
    String mensaje = "";

  public:
    Mensaje() {}
    Mensaje(int tipo, int identificador, String mensaje) {
      this->tipo = tipo;
      this->identificador = identificador;
      this->mensaje = mensaje;
    }
  
    int getTipo() {
      return this->tipo;
    }
    int getIdentificador() {
      return this->identificador;
    }
    String getMensaje() {
      return this->mensaje;
    }
    void setTipo(int tipo) {
      this->tipo = tipo;
    }
    void setIdentificador(int identificador) {
      this->identificador = identificador;
    }
    void setMensaje(String mensaje) {
      this->mensaje = mensaje;
    }
    
    inline bool operator==(const Mensaje& x) {
      if ((this->tipo == x.tipo) && (this->identificador == x.identificador) && (this->mensaje == x.mensaje))
        return true;
      else 
        return false;
    }
    inline bool operator!=(const Mensaje& x) { return !(*this == x); }

    String toString() {
      return String(tipo) + String(identificador) + mensaje;
    }
};
