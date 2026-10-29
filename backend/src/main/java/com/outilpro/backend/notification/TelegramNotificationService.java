package com.outilpro.backend.notification;

import com.outilpro.backend.entity.Commande;
import com.outilpro.backend.entity.LigneCommande;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

// Notifie l'equipe admin sur Telegram des qu'une nouvelle commande est passee sur le site.
//
// Volontairement tolerant aux pannes : si le token/chat-id ne sont pas configures, ou si
// l'appel a l'API Telegram echoue (reseau, token invalide, etc.), on logue simplement un
// avertissement -- on ne doit JAMAIS faire echouer la creation d'une commande a cause d'un
// probleme de notification. D'ou aussi @Async (cf. BackendApplication#EnableAsync) : l'appel
// HTTP vers Telegram se fait sur un thread separe, sans bloquer la reponse au client.
@Service
@Slf4j
public class TelegramNotificationService {

    private final RestClient restClient = RestClient.create();

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.telegram.chat-id:}")
    private String chatId;

    @Value("${app.base-url-admin:https://spartakbrico.com}")
    private String baseUrlAdmin;

    @Async
    public void notifierNouvelleCommande(Commande commande) {
        if (botToken == null || botToken.isBlank() || chatId == null || chatId.isBlank()) {
            // Notification desactivee : aucune variable d'environnement configuree.
            return;
        }

        try {
            String texte = construireMessage(commande);
            String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

            restClient.post()
                    .uri(url)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "chat_id", chatId,
                            "text", texte,
                            "parse_mode", "HTML",
                            "disable_web_page_preview", true
                    ))
                    .retrieve()
                    .toBodilessEntity();

            log.info("Notification Telegram envoyee pour la commande #{}", commande.getId());
        } catch (Exception e) {
            log.warn("Echec de l'envoi de la notification Telegram pour la commande #{} : {}",
                    commande.getId(), e.getMessage());
        }
    }

    private String construireMessage(Commande commande) {
        StringBuilder sb = new StringBuilder();
        sb.append("🛒 <b>Nouvelle commande #").append(commande.getId()).append("</b>\n\n");
        sb.append("👤 Client : ").append(echapper(commande.getNomClient())).append("\n");
        sb.append("📞 Téléphone : ").append(echapper(commande.getTelephoneClient())).append("\n");

        if (commande.getVille() != null && !commande.getVille().isBlank()) {
            sb.append("🏙️ Ville : ").append(echapper(commande.getVille())).append("\n");
        }
        sb.append("📍 Adresse : ").append(echapper(commande.getAdresseLivraison())).append("\n\n");

        sb.append("<b>Articles :</b>\n");
        for (LigneCommande ligne : commande.getLignes()) {
            sb.append("• ").append(echapper(ligne.getProduitNom()))
                    .append(" x").append(ligne.getQuantite())
                    .append(" — ").append(ligne.getSousTotalLigne()).append(" MAD\n");
        }

        sb.append("\n💰 <b>Total : ").append(commande.getTotal()).append(" MAD</b>\n\n");
        sb.append("🔗 ").append(baseUrlAdmin).append("/admin/commandes");

        return sb.toString();
    }

    // Echappe les caracteres speciaux HTML pour le parse_mode="HTML" de Telegram, afin qu'un
    // nom de client contenant par exemple "<" ou "&" ne casse pas le formatage du message.
    private String echapper(String texte) {
        if (texte == null) return "";
        return texte.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
