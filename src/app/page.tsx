import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      {/* ═══ Navigation ═══ */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="font-heading text-2xl font-bold text-indigo">
            djeli
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#tarifs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Tarifs
            </a>
            <a
              href="/connexion"
              className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-craie hover:bg-indigo-light transition-colors"
            >
              Connexion
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Trouvez vos clients{" "}
            <span className="text-indigo">pendant que vous dormez.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Un agent IA qui analyse votre activité, trouve vos acheteurs, leur
            écrit un message personnalisé et vous apporte des rendez-vous.
            Email, WhatsApp, partout en Afrique de l&apos;Ouest.
          </p>

          {/* Champ principal */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Collez le lien de votre site ou décrivez votre activité…"
              className="flex-1 rounded-xl border border-border bg-card px-5 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-safran px-6 py-4 text-base font-semibold text-encre hover:bg-safran-light transition-colors">
              Trouver mes clients
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Paiement par Mobile Money ou carte · Pas de site ? Décrivez votre
            activité.
          </p>
        </div>
      </section>

      {/* ═══ Pipeline en 6 étapes ═══ */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Comment ça marche
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "On analyse votre activité",
                desc: "Collez votre site ou décrivez votre métier. L'agent comprend ce que vous vendez, à qui, et où.",
              },
              {
                step: "2",
                title: "On trouve vos acheteurs",
                desc: "L'agent cherche dans notre base africaine les entreprises qui ont besoin de vous.",
              },
              {
                step: "3",
                title: "On identifie les décideurs",
                desc: "Nom, poste, email, WhatsApp — l'agent trouve la bonne personne à contacter.",
              },
              {
                step: "4",
                title: "On écrit un message personnel",
                desc: "Pas de modèle copié-collé. Chaque message est écrit pour ce prospect, dans sa langue.",
              },
              {
                step: "5",
                title: "On gère les réponses",
                desc: "L'agent répond, relance, et vous prévient sur WhatsApp quand un prospect est intéressé.",
              },
              {
                step: "6",
                title: "On apprend et on ajuste",
                desc: "Chaque semaine, l'agent analyse ce qui marche et améliore les messages et les cibles.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo text-sm font-bold text-craie">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3 différences ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Pourquoi djeli
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Base africaine",
                desc: "Des millions d'entreprises en Afrique de l'Ouest, mises à jour régulièrement. Pas une base mondiale où l'Afrique est une case vide.",
              },
              {
                title: "Email + WhatsApp",
                desc: "L'agent utilise le canal qui marche — WhatsApp pour les PME, email pour les grandes entreprises, les deux si nécessaire.",
              },
              {
                title: "Payez à l'usage en FCFA",
                desc: "Achetez des crédits avec MTN MoMo, Wave ou Moov. Commencez avec 3 000 FCFA, sans abonnement.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-heading text-xl font-bold text-indigo">
                  {item.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Tarifs (crédits) ═══ */}
      <section id="tarifs" className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Des crédits, pas un abonnement
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Comme le crédit téléphonique : vous achetez un pack, vous dépensez à
            votre rythme. L&apos;analyse de votre activité et les rendez-vous
            sont gratuits.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                price: "3 000",
                credits: "300",
                note: "~15 à 30 PME contactées",
              },
              {
                price: "10 000",
                credits: "1 050",
                note: "+5 % de bonus",
                highlight: true,
              },
              {
                price: "25 000",
                credits: "2 750",
                note: "+10 % de bonus",
              },
              {
                price: "50 000",
                credits: "5 750",
                note: "+15 % de bonus",
              },
              {
                price: "150 000",
                credits: "18 000",
                note: "+20 % de bonus",
              },
            ].map((pack) => (
              <div
                key={pack.price}
                className={`rounded-2xl border p-6 ${
                  pack.highlight
                    ? "border-safran bg-safran/5 ring-2 ring-safran"
                    : "border-border bg-background"
                }`}
              >
                <div className="text-3xl font-heading font-bold text-foreground">
                  {pack.price}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    FCFA
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold text-indigo">
                  {pack.credits} crédits
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pack.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Questions fréquentes
          </h2>
          <div className="mt-10 divide-y divide-border">
            {[
              {
                q: "Je n'ai pas de site web, je peux quand même utiliser djeli ?",
                a: "Oui. Décrivez simplement votre activité en quelques lignes, et l'agent fera le reste.",
              },
              {
                q: "Quels pays sont couverts ?",
                a: "Toute l'Afrique de l'Ouest dès le lancement : Bénin, Sénégal, Côte d'Ivoire, Togo, Burkina Faso, Mali, Guinée, Niger, Ghana, Nigeria.",
              },
              {
                q: "Est-ce que c'est du spam ?",
                a: "Non. Chaque message est personnalisé pour le prospect. Si quelqu'un dit STOP, l'agent ne le recontacte plus jamais, pour aucun client.",
              },
              {
                q: "Comment je paie ?",
                a: "Par Mobile Money (MTN MoMo, Moov, Wave, Celtiis, Orange). Pas besoin de carte bancaire.",
              },
              {
                q: "L'agent envoie des messages WhatsApp ?",
                a: "Oui. L'agent envoie directement depuis les numéros djeli, comme un commercial qui écrit à vos prospects.",
              },
              {
                q: "Mes données sont en sécurité ?",
                a: "Vos données restent les vôtres. Aucun partage avec d'autres clients, et vos prospects ne sont jamais revendus.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-foreground">
                  {item.q}
                  <span className="ml-4 text-muted-foreground group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA final ═══ */}
      <section className="border-t border-border bg-indigo py-20 text-craie">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Prêt à trouver vos prochains clients ?
          </h2>
          <p className="mt-4 text-lg text-craie/80">
            L&apos;analyse de votre activité est gratuite. Vous ne payez que
            quand l&apos;agent contacte vos prospects.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="text"
              placeholder="Votre site ou décrivez votre activité…"
              className="flex-1 rounded-xl border border-craie/20 bg-craie/10 px-5 py-4 text-base text-craie placeholder:text-craie/50 focus:outline-none focus:ring-2 focus:ring-safran sm:max-w-md"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-safran px-6 py-4 text-base font-semibold text-encre hover:bg-safran-light transition-colors">
              Commencer
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Pied de page ═══ */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span className="font-heading font-bold text-foreground">djeli</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              CGU
            </a>
            <a href="#" className="hover:text-foreground">
              Confidentialité
            </a>
            <a href="#" className="hover:text-foreground">
              Mentions légales
            </a>
            <a href="#" className="hover:text-foreground">
              Contact
            </a>
          </div>
          <span>© 2026 djeli · Cotonou, Bénin</span>
        </div>
      </footer>
    </main>
  );
}
