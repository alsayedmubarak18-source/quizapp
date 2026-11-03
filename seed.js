const RAW = [
{ q: "A term infant weighs 3.5 kg at birth and grows normally. Which pair of weights is expected at 5 months and at 1 year?", c: 1, o: [
  ["5 kg and 7 kg", "Too low. Birth weight doubles by about 5 months (to ~7 kg), not by 1 year."],
  ["7 kg and 10.5 kg", "Birth weight doubles by ~5 months (3.5 to 7 kg) and triples by 1 year (3.5 to 10.5 kg). Length also rises by about 50% during year 1."],
  ["7 kg and 14 kg", "Doubling at 5 months is right, but weight triples (not quadruples) by 1 year. 14 kg would be 4 times birth weight."],
  ["10.5 kg and 14 kg", "Tripling takes until 1 year, not 5 months. This option has the timeline compressed."]
]},
{ q: "A healthy 5-kg infant in the first year of life is expected to need approximately how much energy, protein and water per day?", c: 2, o: [
  ["125–150 kcal, 4 g protein, 175 mL water", "These are ADULT per-kg values (25–30 kcal, 0.8 g protein, 30–40 mL water) multiplied by 5 kg."],
  ["250–300 kcal, 10 g protein, 750 mL water", "That energy is only ~50–60 kcal/kg, about half of the real requirement of 100–120 kcal/kg/day."],
  ["500–600 kcal, 10 g protein, 750 mL water", "100–120 kcal/kg x 5 = 500–600 kcal; 2 g/kg x 5 = 10 g protein; 150 mL/kg x 5 = 750 mL. Infant BMR per kg is only ~2x adult, but total energy need per kg is ~4x because growth is added on top."],
  ["500–600 kcal, 10 g protein, 200 mL water", "Energy and protein are right, but infant water need is 150 mL/kg/day (750 mL here). 200 mL is an adult-type figure."]
]},
{ q: "A 3-month-old with gastroenteritis becomes dehydrated far faster than an adult would. Which combination best explains this?", c: 3, o: [
  ["Low surface-area-to-mass ratio, high renal concentrating power, large energy reserves", "This is the reverse of the real picture: infants have a large surface area per kg and immature concentrating power."],
  ["Low metabolic rate per kg and low insensible water loss", "Infant metabolic rate per kg is about double the adult rate, and the large surface area increases water loss."],
  ["Mature renal concentrating ability but low water intake per kg", "Concentrating ability is immature, and the fluid requirement is high (150 mL/kg/day vs 30–40 mL/kg/day in adults)."],
  ["High water turnover per kg, immature renal concentrating power, small fluid reserves", "Large surface area and high metabolic rate drive turnover, while poor concentrating power and small reserves mean the infant cannot tolerate fluid loss or fasting."]
]},
{ q: "According to the lecture, which statement about infant digestive maturation is correct?", c: 0, o: [
  ["Pancreatic amylase is very low at birth and rises significantly at 4–6 months", "This is why complex starches in complementary foods become digestible from about 4–6 months. Adult levels are reached by 2 years."],
  ["Lactase is very low at birth and rises with weaning", "Reversed. Lactase is present at term and peaks at birth; in many people it falls after weaning."],
  ["Gastric pH is 2–3 at birth and rises to 6–7 by 2–3 months", "Reversed. Gastric pH is 6–7 at birth and falls to 2–3 by 2–3 months, reaching the adult pattern by about 2 years."],
  ["Pepsin and trypsin reach adult functional capacity by 6 months", "Proteolytic activity reaches adult capacity by about 2 years, not 6 months."]
]},
{ q: "A mother starts starchy rice cereal in her 6-week-old, who then develops bloating and loose, frothy stools. Which physiological limitation is MOST responsible?", c: 2, o: [
  ["Lactase deficiency at term", "Lactase is present at term and peaks at birth, so milk lactose is normally well handled."],
  ["Absent gastric lipase", "Lingual and gastric lipases are active and digest fat, not starch."],
  ["Very low pancreatic amylase at this age", "Pancreatic amylase is very low at birth and rises significantly only at 4–6 months, so complex starch reaches the colon undigested and is fermented."],
  ["Excess gastric acid denaturing the starch", "Gastric pH is high (6–7) in early infancy, and acid does not digest starch anyway."]
]},
{ q: "Breast-fed neonates digest fat efficiently despite low pancreatic lipase and low bile salts. Which pair of enzymes compensates?", c: 1, o: [
  ["Secretory IgA and lactoferrin", "These are immune and antimicrobial proteins, not digestive enzymes."],
  ["Lingual/gastric lipase and milk bile salt-stimulated lipase (BSSL)", "Lingual and gastric lipases start triglyceride hydrolysis in the stomach (up to ~30% of dietary fat before the duodenum), and BSSL from milk completes the job in the duodenum."],
  ["Salivary amylase and lactase", "These act on carbohydrate (starch and lactose), not fat."],
  ["Pepsin and trypsin", "These are proteolytic enzymes and do not digest triglycerides."]
]},
{ q: "Which statement about bile salt-stimulated lipase (BSSL) is correct?", c: 3, o: [
  ["It is a pancreatic enzyme that is fully active in the neonate", "Pancreatic lipase and bile salts are low in neonates. BSSL is the milk enzyme that compensates for this."],
  ["It is abundant in cow’s milk, so formula-fed infants digest fat equally well", "Cow’s milk fat is harder to digest. The active lipase is a feature of human milk."],
  ["It digests up to 30% of dietary fat in the stomach", "That describes the lingual and gastric lipases. BSSL works in the duodenum."],
  ["It is secreted in active form in human milk and is activated by low duodenal bile salt concentrations", "This lets it complete fat digestion even when the infant’s own bile salt pool is small."]
]},
{ q: "Lactose supplies about 40% of an infant’s energy. Which enzyme hydrolyses it, and which product is used directly for brain myelin galactolipid synthesis?", c: 0, o: [
  ["Microvillus (brush-border) lactase; galactose", "Lactase cleaves lactose into glucose and galactose at the brush border. Galactose is used directly for myelin galactolipid synthesis."],
  ["Pancreatic amylase; glucose", "Amylase digests starch, not lactose. Glucose is mainly an energy substrate rather than the myelin galactolipid precursor."],
  ["Microvillus lactase; fructose", "Lactose yields glucose plus galactose. Fructose comes from sucrose."],
  ["Salivary amylase; galactose", "Salivary amylase does not cleave lactose."]
]},
{ q: "All of the following are functions of human milk oligosaccharides (HMOs) EXCEPT:", c: 2, o: [
  ["Selectively fuelling non-pathogenic Bifidobacterium infantis", "True. HMOs are prebiotics that favour beneficial bifidobacteria."],
  ["Acting as decoy receptors that bind luminal pathogens", "True. By mimicking mucosal receptors they prevent pathogens from adhering."],
  ["Being hydrolysed by lactase to supply glucose for infant energy", "HMOs are indigestible glycans that pass undigested to the colon. They are not an energy source for the infant, which makes this the exception."],
  ["Shaping the gut microbiome as prebiotics", "True. This is their main role after reaching the colon undigested."]
]},
{ q: "Why does human milk empty from the stomach faster than cow’s milk?", c: 1, o: [
  ["Its higher total protein content (3.3%) speeds gastric motility", "3.3% is the protein content of cow’s milk. Human milk contains only about 1% protein."],
  ["Its whey-dominant protein (whey:casein 60:40) forms a soft, easily digestible curd", "Cow’s milk is casein-dominant (80% casein), which forms a firm curd that empties slowly."],
  ["Its casein-dominant protein (casein 80%) forms a soft curd", "Reversed. Casein dominance is the feature of cow’s milk and gives a firmer curd."],
  ["Its higher lactose content (7%) acts as a gastric pro-kinetic", "Human milk does contain more lactose, but the lecture attributes rapid emptying to the whey-rich soft curd, not to lactose."]
]},
{ q: "Compared with human milk, cow’s milk contains:", c: 3, o: [
  ["Less protein (1%), more lactose (7%) and mostly whey", "Reversed. These are the features of human milk."],
  ["Similar protein and lactose but much more fat (about 10%)", "Fat is about 3.5–4% in both milks, but it is harder to digest in cow’s milk."],
  ["More protein (3.3%), whey:casein 60:40 and well-absorbed iron", "A 60:40 whey:casein ratio belongs to human milk. Cow’s milk is 20:80 and its iron is poorly absorbed."],
  ["More protein (3.3%), less lactose (4.5%), a higher renal solute load and poorly absorbed iron", "Cow’s milk is casein-dominant (whey 20:casein 80), lower in lactose (4.5% vs 7%), and gives a high renal load, which matters because infant kidneys concentrate poorly."]
]},
{ q: "Which breast-milk component acts as an antimicrobial mainly by binding iron?", c: 2, o: [
  ["Lysozyme", "Lysozyme is antimicrobial by breaking down bacterial cell walls, not by binding iron."],
  ["Secretory IgA", "sIgA gives passive mucosal immunity as an antibody, without inciting inflammation."],
  ["Lactoferrin", "Lactoferrin binds iron, depriving bacteria of an essential nutrient, and is part of the antimicrobial defence of human milk."],
  ["Epidermal growth factor (EGF)", "EGF supports gut maturation and is not an iron-binding protein."]
]},
{ q: "Which prophylaxis is appropriate for a healthy, exclusively breast-fed term newborn?", c: 0, o: [
  ["A single 1 mg IM dose of vitamin K at birth, plus vitamin D 400 IU/day", "Vitamin K stores are low and the gut is sterile at birth, so one IM dose is given. Human milk is low in vitamin D (~25 IU/L), so 400 IU/day is supplemented."],
  ["Daily oral vitamin K and iron 11 mg/day from birth", "Vitamin K is a single IM dose. Prenatal hepatic iron stores last until about 4–6 months, and 11 mg/day is the 7–12 month target."],
  ["Vitamin D 600 IU/day and calcium supplements", "600 IU/day is the figure for children. Infants need 400 IU/day, and breast milk provides enough calcium."],
  ["Vitamin A and zinc from birth", "Vitamin A is for endemic deficiency areas, and the zinc figure (3 mg) applies from 7 months to 3 years."]
]},
{ q: "An exclusively breast-fed infant takes about 800 mL/day of milk containing ~25 IU/L of vitamin D. What is the approximate intake, and how does it compare with the 400 IU/day recommendation?", c: 1, o: [
  ["About 100 IU/day (~25% of the recommendation)", "That would require about 4 L of milk per day, far more than an infant drinks."],
  ["About 20 IU/day (~5% of the recommendation)", "0.8 L x 25 IU/L = 20 IU, only about 5% of 400 IU. This is why exclusively breast-fed infants need vitamin D supplements."],
  ["About 200 IU/day (~50% of the recommendation)", "That would require about 8 L of milk per day."],
  ["About 400 IU/day (100% of the recommendation)", "That would require about 16 L of milk per day. Human milk vitamin D is very low."]
]},
{ q: "A 5-day-old exclusively breast-fed neonate who received no prophylaxis presents with GI bleeding and ecchymoses. Which mechanism best explains the risk?", c: 3, o: [
  ["Immature glucuronyl transferase impairing bilirubin conjugation", "This causes physiological jaundice, not bleeding."],
  ["Poor renal concentrating ability", "This predisposes to dehydration, not haemorrhage."],
  ["Small hepatic glycogen stores", "This predisposes to hypoglycaemia."],
  ["Low vitamin K stores plus a sterile gut with no bacterial vitamin K synthesis", "The newborn has low vitamin K stores and no colonic flora to make more, so haemorrhage is a risk. A single 1 mg IM dose at birth prevents it."]
]},
{ q: "A 7-month-old exclusively breast-fed infant, given no solids or supplements, is pale and irritable. Which statement best reflects the physiology and the correct recommendation?", c: 2, o: [
  ["Prenatal iron stores last until 12 months, so the pallor is unrelated to iron", "Prenatal hepatic iron stores are depleted by 4–6 months."],
  ["Switch to cow’s milk as the main drink because its iron is better absorbed", "Cow’s milk iron is poorly absorbed and its high renal load is also undesirable."],
  ["Prenatal stores are depleted by 4–6 months, so give iron-rich foods (meat, fortified cereal, legumes) aiming for about 11 mg/day", "Iron is needed for cytochromes, haemoglobin synthesis and neurocognitive development. The target is 11 mg/day at 7–12 months and 7 mg/day at 1–3 years."],
  ["Aim for 7 mg/day because iron needs peak at 1–3 years", "7 mg/day is the 1–3 year figure. At 7–12 months the need is higher, 11 mg/day."]
]},
{ q: "Which age group has the highest daily calcium requirement, and why?", c: 0, o: [
  ["9–18 years (1,300 mg/day), because peak calcium accrual occurs in adolescence", "Body calcium rises from about 25 g at birth to about 1,000 g in adults, with peak accrual in adolescence. Requirements are 700, 1,000 and 1,300 mg/day for 1–3, 4–8 and 9–18 years."],
  ["1–3 years (1,300 mg/day), because growth is fastest then", "The requirement at 1–3 years is 700 mg/day. Growth is fastest in infancy, but calcium accrual peaks later."],
  ["4–8 years (1,000 mg/day), because teeth form then", "1,000 mg/day is correct for this age group, but it is not the highest."],
  ["Adults, because the skeleton holds 1,000 g of calcium", "A large store does not mean a high daily requirement. Accrual, not maintenance, drives the peak."]
]},
{ q: "An exclusively breast-fed 8-month-old of a strict vegan mother has developmental regression and megaloblastic anaemia. Deficiency of which nutrient is most likely?", c: 3, o: [
  ["Iron", "Iron deficiency causes a microcytic, hypochromic anaemia rather than a megaloblastic one."],
  ["Vitamin D", "Vitamin D deficiency affects calcium and phosphate absorption and bone mineralisation."],
  ["Iodine", "Iodine deficiency impairs thyroid hormone and CNS development but does not cause megaloblastic anaemia."],
  ["Vitamin B12", "A strict maternal vegan diet leads to infant B12 deficiency, since B12 is found only in animal foods. The requirement is only 0.4–0.5 µg/day at 0–12 months."]
]},
{ q: "A 2-year-old has faltering linear growth, recurrent infections and slow mucosal healing. Which micronutrient deficiency fits best?", c: 1, o: [
  ["Iodine", "Iodine is needed for thyroid hormone and CNS development, and deficiency mainly affects neurodevelopment."],
  ["Zinc", "Zinc is a cofactor for more than 300 enzymes and is essential for mucosal repair, immunity and linear growth velocity. The requirement is 3 mg/day (7 months to 3 years)."],
  ["Vitamin A", "Deficiency raises infection risk, but its hallmark is xerophthalmia, not growth faltering and slow mucosal repair."],
  ["Vitamin K", "Deficiency presents with bleeding, not growth or immunity problems."]
]},
{ q: "Which amino acids are conditionally essential in infants because of immature hepatic biosynthetic pathways (e.g. low cystathionase activity)?", c: 2, o: [
  ["Leucine, isoleucine and valine", "These are essential at every age. They are never synthesised, so they are not ‘conditionally’ essential."],
  ["Alanine, serine and proline", "These are readily synthesised even in infants."],
  ["Histidine, cysteine and taurine", "The infant liver cannot make enough of these, so they must come from the diet (human milk supplies them)."],
  ["Glycine, alanine and glutamate", "These are non-essential amino acids that infants synthesise readily."]
]},
{ q: "Which amino acid is critical for both bile acid conjugation and retinal neural differentiation in infants?", c: 0, o: [
  ["Taurine", "Taurine is conditionally essential in infants and supports bile acid conjugation and retinal neural differentiation."],
  ["Glycine", "Glycine can also conjugate bile acids, but it is not conditionally essential and has no retinal role."],
  ["Cysteine", "Cysteine is a precursor in the pathway to taurine (limited by low cystathionase), but taurine itself is the active molecule."],
  ["Histidine", "Histidine is conditionally essential, but it is not the amino acid linked to bile acid conjugation or retinal differentiation."]
]},
{ q: "Using the lecture’s values, what is the approximate daily protein requirement of a 12-kg, 2-year-old child?", c: 1, o: [
  ["9.6 g", "This is the adult value (0.8 g/kg) multiplied by 12 kg."],
  ["14.4 g", "The 1–3 year requirement is 1.2 g/kg/day, so 1.2 x 12 = 14.4 g. It is intermediate between the infant (2.0 g/kg) and adult (0.8 g/kg) values."],
  ["24 g", "This is the 0–3 month infant value (2.0 g/kg) multiplied by 12 kg."],
  ["36 g", "3 g/kg/day is not a recommended intake at any age in this lecture."]
]},
{ q: "Which statement about brain lipids and DHA in early life is correct?", c: 3, o: [
  ["Lipids are about 20% of dry brain weight and DHA accumulation peaks in adolescence", "Lipids make up about 50% of dry brain weight, and DHA accumulates mainly in the first 2 years."],
  ["Lipids are about 50% of dry brain weight and DHA accumulation is complete at birth", "DHA accumulation is rapid after birth and continues during the first 2 years."],
  ["Lipids are about 50% of dry brain weight and human milk contains no DHA", "Human milk is rich in long-chain PUFAs (DHA and AA), which are substrates for CNS myelination and retinal photoreceptor maturation."],
  ["Lipids are about 50% of dry brain weight and DHA accumulates rapidly in the first 2 years, supporting dendritic arborisation", "This is the period of fastest brain lipid accretion, which is why long-chain PUFA supply matters."]
]},
{ q: "A preterm infant born at 31 weeks cannot coordinate sucking and swallowing. Which statement best explains this?", c: 2, o: [
  ["Lactase is absent until term", "Lactase is present at term and is not responsible for suck–swallow coordination."],
  ["Gastric acid secretion matures only at 2 years", "Gastric acid maturity does not govern feeding reflexes."],
  ["The feeding reflexes (rooting, sucking, swallowing) mature at about 34–37 weeks’ gestation", "At 31 weeks these reflexes are not yet coordinated, so tube feeding or other support is often required."],
  ["Pancreatic amylase appears only at 4–6 months", "Amylase concerns starch digestion and has nothing to do with suck–swallow coordination."]
]},
{ q: "High gut permeability in the neonate is advantageous but also carries which risk?", c: 0, o: [
  ["It lets intact IgA from milk be taken up (passive immunity) but also lets food antigens in, risking sensitisation", "Macromolecule uptake (IgA and antigens) is high at birth and closes within weeks to months."],
  ["It prevents any macromolecule uptake, so milk IgA is digested", "Reversed. Permeability is high, which allows macromolecule uptake."],
  ["It causes fat malabsorption through loss of bile salts", "Permeability does not cause bile salt loss. Low bile salts are a separate feature, compensated by BSSL."],
  ["It raises gastric acid secretion and ulcer risk", "Gastric acid is low in early infancy and is unrelated to permeability."]
]},
{ q: "A mother worries that she produces only a few mL of colostrum per feed on day 1. Which finding makes this physiologically appropriate?", c: 1, o: [
  ["Day-1 gastric capacity is about 30 mL, rising to about 100 mL by day 3", "These figures are too large. Day-1 capacity is only about 5–7 mL."],
  ["Gastric capacity is about 5–7 mL on day 1, about 22–27 mL on day 3 and about 80–150 mL at 1 month", "The newborn stomach is tiny, so small, frequent feeds match physiology. The adult capacity is 1–1.5 L."],
  ["Gastric capacity is already 80–150 mL on day 1", "That is the capacity at about 1 month."],
  ["Gastric capacity is 1–1.5 L from birth", "That is the adult capacity."]
]},
{ q: "Which of the following is NOT part of recommended complementary feeding at about 6 months?", c: 2, o: [
  ["Starting with iron-rich foods such as meat, fortified cereals or legumes", "Recommended. Iron stores decline by 4–6 months."],
  ["Continuing breast milk or formula as the main energy source until about 12 months", "Recommended. Solids complement milk and do not replace it."],
  ["Delaying peanut and egg until after 3 years to prevent allergy", "Not recommended. Early introduction of common allergens such as peanut and egg under guidance reduces allergy risk."],
  ["Following hunger and satiety cues and avoiding force-feeding", "Recommended. This is responsive feeding and supports self-regulation."]
]},
{ q: "Which feeding pattern is most appropriate for a healthy 10-month-old?", c: 3, o: [
  ["Exclusive breastfeeding on demand with vitamin D", "This is the 0–6 month pattern."],
  ["Starting the first soft, iron-rich foods alongside milk", "This is the 6–9 month stage, which this infant should have already passed."],
  ["Family foods with full-fat milk as the main drink", "This is the 1–3 year pattern."],
  ["Mashed and finger foods, three meals a day, plus breast milk or formula", "This is the 9–12 month stage, with textures progressing as oral-motor skills mature."]
]},
{ q: "An 18-month-old on a starchy, low-protein diet with adequate calories has pitting oedema, a pot belly, a fatty liver, apathy and irritability. Which mechanism best explains the oedema?", c: 1, o: [
  ["Adaptive loss of muscle and fat stores to conserve energy", "This describes marasmus (total calorie deficit), which has no oedema."],
  ["Hypoalbuminaemia lowering plasma oncotic pressure", "This is kwashiorkor: protein deficiency with adequate calories lowers albumin markedly, reducing oncotic pressure and causing oedema."],
  ["Increased hepatic albumin synthesis causing fluid retention", "Albumin synthesis falls, not rises, in protein deficiency."],
  ["Excess total calorie intake causing fluid retention", "Calories are adequate, not excessive. The deficit is protein."]
]},
{ q: "A 12-month-old shows severe wasting with an ‘old man’ face. He is alert and hungry, has no oedema, and his albumin is only mildly low. What is the primary deficit, and what is the mechanism?", c: 0, o: [
  ["Total calories; adaptive somatic muscle wasting and loss of fat stores", "This is marasmus. The child adapts to energy deficit by breaking down muscle and fat, so albumin is preserved and there is no oedema."],
  ["Protein with adequate calories; reduced plasma oncotic pressure", "This describes kwashiorkor, which features oedema, a pot belly, fatty liver and apathy."],
  ["Vitamin A; xerophthalmia", "Vitamin A deficiency causes xerophthalmia and infection risk, not generalised wasting."],
  ["Iron; impaired cytochrome function", "Iron deficiency causes anaemia and neurocognitive effects, not generalised wasting."]
]}
];

export const SEED = [{
  id: 'seed-nutrition-1', lang: 'en', title: 'Nutrition in Infants & Children: High-Yield (Hard)',
  questions: RAW.map(r => ({ q: r.q, correct: r.c, options: r.o.map(x => ({ t: x[0], e: x[1] })) }))
}];
