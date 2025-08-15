// Mock AI analysis for animal identification
// In a real implementation, this would connect to an AI service like Google Vision API or custom model

export interface AnimalAnalysis {
  animalType: string;
  confidence: number;
}

const animalTypes = [
  'Lion', 'Elephant', 'Giraffe', 'Zebra', 'Cheetah', 'Leopard', 
  'Buffalo', 'Rhinoceros', 'Hippopotamus', 'Antelope', 'Gazelle',
  'Wildebeest', 'Hyena', 'Wild Dog', 'Baboon', 'Monkey', 'Bird'
];

export async function analyzeAnimalImage(file: File): Promise<{ animalType: string }> {
  // Check the first letter of the file name to determine the animal type
  const firstLetter = file.name[0]?.toUpperCase();

  let animalType = "Unknown";
  if (firstLetter === "B") {
    animalType = "Buffalo";
  } else if (firstLetter === "Z") {
    animalType = "Zebra";
  } else if (firstLetter === "R") {
    animalType = "Rhino";
  } else if (firstLetter === "E") {
    animalType = "Elephant";
  }

  // Generate a random confidence level between 92% and 100%
  const confidence = Math.floor(Math.random() * 9) + 92; // 92 to 100

  // Simulate async behavior
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return { animalType: `${animalType} (${confidence}%)` };
}