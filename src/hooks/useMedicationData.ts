import { useState, useEffect } from "react";

// Fonction pour extraire la molécule et le dosage d'un nom de médicament
const extractMoleculeAndDosage = (name: string): string => {
  // Nettoyer le nom
  let cleaned = name.trim();
  
  // Extraire la partie avant la virgule (molécule + dosage)
  const parts = cleaned.split(',');
  if (parts.length >= 2) {
    const moleculePart = parts[0].trim();
    // Garder uniquement molécule + dosage, ignorer la forme galénique
    return moleculePart.toLowerCase();
  }
  
  return cleaned.toLowerCase();
};

// Fonction pour normaliser les formes galéniques similaires
const normalizeForm = (name: string): string => {
  return name
    .replace(/comprimé pelliculé sécable/gi, 'comprimé')
    .replace(/comprimé pelliculé/gi, 'comprimé')
    .replace(/comprimé sécable/gi, 'comprimé')
    .replace(/comprimé enrobé/gi, 'comprimé')
    .replace(/comprimé orodispersible/gi, 'comprimé')
    .replace(/comprimé effervescent/gi, 'comprimé effervescent')
    .replace(/gélule à libération prolongée/gi, 'gélule LP')
    .replace(/solution injectable en seringue préremplie/gi, 'solution injectable')
    .replace(/solution injectable en stylo prérempli/gi, 'solution injectable')
    .replace(/solution injectable en cartouche/gi, 'solution injectable')
    .replace(/poudre pour solution buvable en sachet-dose/gi, 'poudre pour solution buvable')
    .replace(/poudre pour solution buvable en sachet/gi, 'poudre pour solution buvable')
    .replace(/granulés pour solution buvable en sachet-dose/gi, 'granulés pour solution buvable')
    .replace(/granulés pour solution buvable/gi, 'poudre pour solution buvable');
};

// Fonction de déduplication
const deduplicateMedications = (medications: string[]): string[] => {
  const seen = new Map<string, string>();
  
  for (const med of medications) {
    // Normaliser la forme galénique
    const normalized = normalizeForm(med);
    // Extraire la clé unique (molécule + dosage)
    const key = extractMoleculeAndDosage(normalized);
    
    // Garder la première occurrence (généralement la plus courte/simple)
    if (!seen.has(key)) {
      seen.set(key, med);
    } else {
      // Préférer les noms plus courts (souvent plus génériques)
      const existing = seen.get(key)!;
      if (med.length < existing.length) {
        seen.set(key, med);
      }
    }
  }
  
  // Retourner les valeurs triées
  return Array.from(seen.values()).sort((a, b) => 
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );
};

export const useMedicationData = () => {
  const [medications, setMedications] = useState<string[]>([]);

  useEffect(() => {
    // Load medication data from CSV
    fetch('/medicaments.csv')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n').slice(1); // Skip header
        const medList = lines
          .map(line => line.trim().replace(/^"|"$/g, '')) // Remove quotes
          .filter(line => line.length > 0);
        
        // Dédupliquer les médicaments
        const deduplicated = deduplicateMedications(medList);
        console.log(`Médicaments: ${medList.length} → ${deduplicated.length} après déduplication`);
        setMedications(deduplicated);
      })
      .catch(error => {
        console.error('Error loading medication data:', error);
        // Fallback to some basic medications
        setMedications([
          "Paracétamol",
          "Ibuprofène",
          "Amoxicilline",
          "Doliprane",
          "Efferalgan",
          "Aspirine",
          "Warfarine",
        ]);
      });
  }, []);

  return medications;
};
