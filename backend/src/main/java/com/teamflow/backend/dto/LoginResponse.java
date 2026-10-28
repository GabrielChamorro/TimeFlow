package com.teamflow.backend.dto;

public class LoginResponse {
    private String token;
    private String email;
    private String rol;

    public LoginResponse(String token, String email, String rol) {
        this.token = token;
        this.email = email;
        this.rol = rol;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getRol() { return rol; }
}