#pragma once

class Mensaje {
  private:
    int tipo;
    int identificador;
    String mensaje;

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

    String toString() {
      return tipo + identificador + mensaje;
    }
};
