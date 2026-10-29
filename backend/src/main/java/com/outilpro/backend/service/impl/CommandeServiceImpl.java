package com.outilpro.backend.service.impl;

import com.outilpro.backend.dto.*;
import com.outilpro.backend.entity.*;
import com.outilpro.backend.exception.ResourceNotFoundException;
import com.outilpro.backend.notification.TelegramNotificationService;
import com.outilpro.backend.repository.CommandeRepository;
import com.outilpro.backend.repository.ProduitRepository;
import com.outilpro.backend.service.CommandeService;
import com.outilpro.backend.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommandeServiceImpl implements CommandeService {

    private final CommandeRepository commandeRepository;
    private final ProduitRepository produitRepository;
    private final PromoCodeService promoCodeService;
    private final TelegramNotificationService telegramNotificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<CommandeResponse> findAllPagine(StatutCommande statut, Pageable pageable) {
        Page<Commande> page = (statut != null)
                ? commandeRepository.findByStatut(statut, pageable)
                : commandeRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CommandeResponse findById(Long id) {
        return toResponse(getCommandeOuThrow(id));
    }

    @Override
    public CommandeResponse create(CommandeRequest request) {
        // Livraison toujours gratuite, sans frais selon la ville ; la ville saisie par le
        // client est tout de même enregistrée (simple texte) pour que l'admin sache où expédier.
        Commande commande = Commande.builder()
                .nomClient(request.getNomClient())
                .telephoneClient(request.getTelephoneClient())
                .adresseLivraison(request.getAdresseLivraison())
                .ville(request.getVille())
                .statut(StatutCommande.EN_ATTENTE)
                .dateCreation(LocalDateTime.now())
                .build();

        BigDecimal sousTotal = BigDecimal.ZERO;

        for (LigneCommandeRequest ligneRequest : request.getLignes()) {
            // Verrou pessimiste (FOR UPDATE) : indispensable ici car on lit le stock puis on
            // le décrémente. Sans lui, deux commandes passées au même instant pour le dernier
            // exemplaire d'un produit pourraient toutes les deux passer la vérification
            // ci-dessous avant qu'aucune n'ait sauvegardé — d'où une survente possible.
            // Cette transaction reste bloquée sur ce SELECT jusqu'à ce qu'une commande
            // concurrente sur le même produit ait fini (COMMIT/ROLLBACK) avant de lire à son tour.
            Produit produit = produitRepository.findByIdPourMiseAJourStock(ligneRequest.getProduitId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Produit introuvable, id=" + ligneRequest.getProduitId()));

            if (produit.getStock() < ligneRequest.getQuantite()) {
                throw new IllegalArgumentException(
                        "Stock insuffisant pour '" + produit.getNom() + "' (disponible: " + produit.getStock()
                                + ", demandé: " + ligneRequest.getQuantite() + ")");
            }

            // On facture le prix EFFECTIF (promo si actif, sinon prix normal) — jamais produit.getPrix()
            // directement, sinon un produit en promo serait affiché à un prix et facturé à un autre.
            BigDecimal prixFacture = produit.getPrixEffectif();

            BigDecimal sousTotalLigne = prixFacture
                    .multiply(BigDecimal.valueOf(ligneRequest.getQuantite()))
                    .setScale(2, RoundingMode.HALF_UP);

            LigneCommande ligne = LigneCommande.builder()
                    .produitId(produit.getId())
                    .produitNom(produit.getNom())
                    .produitSku(produit.getSku())
                    .prixUnitaire(prixFacture)
                    .quantite(ligneRequest.getQuantite())
                    .sousTotalLigne(sousTotalLigne)
                    .build();

            commande.ajouterLigne(ligne);
            sousTotal = sousTotal.add(sousTotalLigne);

            produit.setStock(produit.getStock() - ligneRequest.getQuantite());
            produitRepository.save(produit);
        }

        BigDecimal reduction = BigDecimal.ZERO;
        String codePromoUtilise = null;

        if (request.getCodePromo() != null && !request.getCodePromo().isBlank()) {
            reduction = promoCodeService.appliquer(request.getCodePromo(), sousTotal);
            codePromoUtilise = request.getCodePromo().trim().toUpperCase();
        }

        BigDecimal total = sousTotal.subtract(reduction)
                .setScale(2, RoundingMode.HALF_UP);

        commande.setSousTotal(sousTotal.setScale(2, RoundingMode.HALF_UP));
        commande.setReductionMontant(reduction.setScale(2, RoundingMode.HALF_UP));
        commande.setCodePromoUtilise(codePromoUtilise);
        commande.setTotal(total);

        Commande commandeSauvegardee = commandeRepository.save(commande);
        telegramNotificationService.notifierNouvelleCommande(commandeSauvegardee);
        return toResponse(commandeSauvegardee);
    }

    @Override
    public CommandeResponse changerStatut(Long id, StatutCommande nouveauStatut) {
        Commande commande = getCommandeOuThrow(id);
        commande.setStatut(nouveauStatut);
        return toResponse(commandeRepository.save(commande));
    }

    @Override
    public void delete(Long id) {
        // Suppression definitive reservee a ADMIN (voir CommandeController) : utile pour
        // nettoyer des commandes de test, mais a eviter en usage normal -- le statut
        // ANNULEE est prefere pour une vraie commande client (garde une trace/historique).
        // Le stock n'est PAS restitue automatiquement : la suppression ici sert a effacer
        // une commande erronee/de test, pas a "annuler proprement" une commande reelle.
        commandeRepository.delete(getCommandeOuThrow(id));
    }

    private Commande getCommandeOuThrow(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande introuvable, id=" + id));
    }

    private CommandeResponse toResponse(Commande commande) {
        List<LigneCommandeResponse> lignes = commande.getLignes().stream()
                .map(this::toLigneResponse)
                .collect(Collectors.toList());

        return CommandeResponse.builder()
                .id(commande.getId())
                .nomClient(commande.getNomClient())
                .telephoneClient(commande.getTelephoneClient())
                .adresseLivraison(commande.getAdresseLivraison())
                .ville(commande.getVille())
                .sousTotal(commande.getSousTotal())
                .reductionMontant(commande.getReductionMontant())
                .codePromoUtilise(commande.getCodePromoUtilise())
                .total(commande.getTotal())
                .statut(commande.getStatut())
                .dateCreation(commande.getDateCreation())
                .lignes(lignes)
                .build();
    }

    private LigneCommandeResponse toLigneResponse(LigneCommande ligne) {
        return LigneCommandeResponse.builder()
                .produitId(ligne.getProduitId())
                .produitNom(ligne.getProduitNom())
                .produitSku(ligne.getProduitSku())
                .prixUnitaire(ligne.getPrixUnitaire())
                .quantite(ligne.getQuantite())
                .sousTotalLigne(ligne.getSousTotalLigne())
                .build();
    }
}
