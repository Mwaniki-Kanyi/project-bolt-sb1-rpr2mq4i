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

export const analyzeAnimalImage = async (imageFile: File): Promise<AnimalAnalysis> => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock analysis - randomly select an animal type
  const randomAnimal = animalTypes[Math.floor(Math.random() * animalTypes.length)];
  const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
  
  return {
    animalType: randomAnimal,
    confidence: Math.round(confidence * 100) / 100
  };
};