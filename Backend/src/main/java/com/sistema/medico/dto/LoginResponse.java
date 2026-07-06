package com.sistema.medico.dto;

public class LoginResponse {
    private Integer idUsuario;
    private String username;
    private String rol;
    private String nombresCompletos;

    public LoginResponse() {}

    public LoginResponse(Integer idUsuario, String username, String rol, String nombresCompletos) {
        this.idUsuario = idUsuario;
        this.username = username;
        this.rol = rol;
        this.nombresCompletos = nombresCompletos;
    }

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getNombresCompletos() { return nombresCompletos; }
    public void setNombresCompletos(String nombresCompletos) { this.nombresCompletos = nombresCompletos; }
}
