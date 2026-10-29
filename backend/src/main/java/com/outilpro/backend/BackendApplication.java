package com.outilpro.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

// @EnableAsync : indispensable pour que TelegramNotificationService.notifierNouvelleCommande
// (annotee @Async) s'execute sur un thread separe. Sans cette annotation, Spring ignore
// silencieusement @Async et l'appel HTTP vers l'API Telegram bloquerait la requete du client
// qui passe commande (et une erreur reseau Telegram ferait echouer la commande elle-meme).
@SpringBootApplication
@EnableAsync
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
