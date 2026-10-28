package com.teamflow.backend.models;

import jakarta.persistence.*;

@Entity
@Table(name = "mensajes")
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id")
    private String chatId;

    @Column(name = "recipient_id")
    private Long recipientId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_name", nullable = false)
    private String senderName;

    @Column(name = "sender_avatar")
    private String senderAvatar;

    @Column(name = "sender_role", nullable = false)
    private String senderRole;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(nullable = false)
    private String timestamp;

    public Mensaje() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }

    public Long getRecipientId() { return recipientId; }
    public void setRecipientId(Long recipientId) { this.recipientId = recipientId; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderAvatar() { return senderAvatar; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
