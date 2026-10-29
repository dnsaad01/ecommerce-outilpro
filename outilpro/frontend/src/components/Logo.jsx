/* Logo "Spartak brico" : lockup officiel (casque spartiate + roue dentée +
   marteau/clé croisés, wordmark "SPARTAK brico") fourni par l'équipe, détouré
   avec un fond réellement transparent (PNG alpha). Icône et nom sont déjà
   assemblés dans l'image -- on l'affiche tel quel, dimensionné par la hauteur
   pour rester net et responsive sur n'importe quel fond (clair ou sombre,
   client ou admin), sans cadre ni fond rajouté. */

import logoSpartakBrico from '../assets/logo-spartak-brico.png';

export function Logo({ className = 'h-10' }) {
    return (
        <img
            src={logoSpartakBrico}
            alt="Spartak brico"
            className={`w-auto object-contain shrink-0 ${className}`}
        />
    );
}
