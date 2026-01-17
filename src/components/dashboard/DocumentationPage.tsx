import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const DocumentationPage = () => {
  return (
    <div className="space-y-6">
      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1) Partners tábla – összesített partner statisztika</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ez a fő tábla. Minden sor egy partner (ügyfél).
          </p>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Oszlopok magyarázata</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">partner</h4>
                <p className="text-muted-foreground text-sm">Az ügyfél neve (Partner-adatbázis mező értéke).</p>
              </div>
              
              <div>
                <h4 className="font-medium">összes_árajánlat (total_quotes)</h4>
                <p className="text-muted-foreground text-sm">Hány árajánlat ticket tartozik ehhez a partnerhez az adott időszakban.</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikeres_árajánlatok (completed_quotes)</h4>
                <p className="text-muted-foreground text-sm">Hány olyan árajánlat van, aminek van al-tickete (Members), tehát "befejezett".</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikertelen_árajánlatok (incomplete_quotes)</h4>
                <p className="text-muted-foreground text-sm">Hány olyan árajánlat van, aminek nincs al-tickete.</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikerességi_arány (completion_rate)</h4>
                <p className="text-muted-foreground text-sm">
                  A nyers sikerességi arány: <code className="bg-muted px-1 rounded">completed_quotes / total_quotes</code>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Példa: 10 árajánlatból 2 sikeres → 0,20 (20%).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">korrigált_sikerességi_arány (adjusted_completion_rate)</h4>
                <p className="text-muted-foreground text-sm">
                  Egy "simított" sikerességi arány, ami figyelembe veszi, hogy kevés adatnál a nyers arány nagyon csalóka lehet.
                  Ennek célja, hogy egy 1/1 = 100% ne verjen meg egy 58/70 = 82,9%-ot csak azért, mert kevés a minta.
                </p>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">A simítás lényege:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>van egy céges átlag sikerességi arány (globalRate), ami kb. 0,14–0,15 (14–15%),</li>
                    <li>és ezt használjuk "prior"-ként,</li>
                    <li>így kapunk egy stabilabb, összehasonlítható értéket.</li>
                  </ul>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-2">Képlet:</p>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <span className="mr-2">adjusted_completion_rate =</span>
                    <div className="inline-flex flex-col items-center">
                      <span className="border-b border-muted-foreground px-2">completed_quotes + k · globalRate</span>
                      <span className="px-2">total_quotes + k</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 text-center">ahol <code className="bg-muted px-1 rounded">k</code> egy korrekciós súly (pl. 20).</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">érték_pontszám (value_score)</h4>
                <p className="text-muted-foreground text-sm">
                  Ez azt mutatja, hogy a partner mennyire "értékes" árajánlat-szempontból, a volumen és a minőség együtt:
                </p>
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm">value_score = adjusted_completion_rate * total_quotes</code>
                <p className="text-muted-foreground text-sm mt-2">
                  Ez gyakorlatilag a várható sikeres árajánlatok száma (korrigált aránnyal).
                </p>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Példa:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Partner A: 70 árajánlat, 0,83 korrigált arány → value_score ≈ 58</li>
                    <li>Partner B: 7 árajánlat, 0,86 korrigált arány → value_score ≈ 6</li>
                    <li>→ A sokkal értékesebb, mert nagy volumenben is hozza a sikert.</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">sikertelen_pontszám (waste_score)</h4>
                <p className="text-muted-foreground text-sm">
                  Ez a "veszteség" / "időhúzás" jellegű pontszám:
                </p>
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm">waste_score = (1 - adjusted_completion_rate) * total_quotes</code>
                <p className="text-muted-foreground text-sm mt-2">
                  Minél magasabb, annál több olyan árajánlat várható, ami nem vezet eredményre.
                  Ez nem azt jelenti, hogy "rossz ember az ügyfél", hanem hogy arányában sok erőforrás megy el rá kevés eredménnyel.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">legutóbbi_sikeres_dátum (last_completed_date)</h4>
                <p className="text-muted-foreground text-sm">Az utolsó olyan árajánlat dátuma, amely "befejezett" volt (volt al-ticket).</p>
              </div>
              
              <div>
                <h4 className="font-medium">legutóbbi_árajánlat_dátum (last_quote_date)</h4>
                <p className="text-muted-foreground text-sm">Az adott partner legutóbbi árajánlatkérésének dátuma.</p>
              </div>
              
              <div>
                <h4 className="font-medium">napok_a_legutóbbi_árajánlat_óta (days_since_last_quote)</h4>
                <p className="text-muted-foreground text-sm">Hány nap telt el az utolsó árajánlat óta.</p>
              </div>
              
              <div>
                <h4 className="font-medium">alvó (is_sleeping)</h4>
                <p className="text-muted-foreground text-sm">
                  A partner akkor "alvó", ha a legutóbbi árajánlat óta több mint X nap telt el (jellemzően 90 nap).
                  Cél: könnyen azonosítani az inaktív ügyfeleket.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">kategória (category)</h4>
                <p className="text-muted-foreground text-sm">Automatikus besorolás az árajánlat viselkedés alapján. Példák:</p>
                <ul className="list-disc list-inside text-muted-foreground text-sm mt-1 space-y-1">
                  <li><strong>MAGAS_ÉRTÉK:</strong> jó korrigált arány + elég nagy minta → érdemes rá fókuszálni</li>
                  <li><strong>ROSSZ_ARÁNY / IDŐHÚZÓ:</strong> alacsony korrigált arány + elég nagy minta → sok erőforrás, kevés eredmény</li>
                  <li><strong>KEVÉS_ÁRAJÁNLAT:</strong> túl kevés adat, nem megbízható még a megítélés</li>
                  <li><strong>KÖZEPES:</strong> nem kiugró egyik irányba sem</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Best Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2) top_best_customers – "Top értékes" partnerek listája</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Ez a lista azokból a partnerekből készül, akik:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>elég sok árajánlattal rendelkeznek (minimum mintaszám),</li>
            <li>és a korrigált sikerességi arányuk a cég átlagához képest magas,</li>
            <li>és a rangsor alapja főleg az érték_pontszám (value_score).</li>
          </ul>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Mit jelent itt a rang?</h4>
            <p className="text-muted-foreground text-sm">
              A rangsor azt mutatja, hogy ki hozza a legtöbb várható sikeres ajánlatot (volumen + minőség),
              tehát kikkel érdemes a legjobban foglalkozni, mert nagyobb eséllyel térül meg az árajánlat-készítés.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Worst Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3) top_worst_customers – "Top időhúzó / rossz arányú" partnerek listája</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Ez a lista azokból a partnerekből készül, akik:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>elég sok árajánlattal rendelkeznek (minimum mintaszám),</li>
            <li>és a korrigált sikerességi arányuk alacsony a cég átlagához képest,</li>
            <li>és a rangsor alapja főleg a sikertelen_pontszám (waste_score).</li>
          </ul>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Mit jelent itt a rang?</h4>
            <p className="text-muted-foreground text-sm">
              A rangsor azt mutatja, hogy kiknél várható a legtöbb "nem megtérülő" árajánlat,
              tehát kikkel kapcsolatban érdemes üzletileg átgondolni a stratégiát (pl. minősítés, előszűrés, új folyamat, más kommunikáció).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sleeping Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4) sleeping_customers – alvó / inaktív partnerek</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Ez a lista azokból áll, akiknél:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>a legutóbbi árajánlat óta több mint X nap telt el (pl. 90 nap),</li>
            <li>a lista rendezése általában a legrégebbi utolsó árajánlattól a frissebb felé történik.</li>
          </ul>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Cél:</h4>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>visszaaktiválási kampányok,</li>
              <li>ügyfélgondozás,</li>
              <li>"kieső" ügyfelek korai felismerése.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-xl">Fontos megjegyzések / értelmezés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>A statisztika <strong>nem minősít embereket</strong>, hanem árajánlat-viselkedést mér.</li>
            <li>A "rossz" lista <strong>nem azt jelenti, hogy "rossz ügyfél"</strong>, hanem hogy sok munka kevés eredménnyel.</li>
            <li>A korrigált arány és a pontszámok azért vannak, hogy a cég alacsony átlagos sikeressége (kb. 14–15%) mellett is reális összehasonlítást kapjunk.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Refresh */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Adatfrissítés</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A dashboard adatai webhookon keresztül frissülnek.
            A "Frissítés" gomb egy n8n webhookot hív meg, ami visszaadja a 4 tábla aktuális adatait, és a felület automatikusan újratölti őket.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
