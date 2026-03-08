// Question bank for Portuguese 1st cycle curriculum
export interface Question {
  id: string;
  school_year: "1" | "2" | "3" | "4";
  subject: "portugues" | "matematica" | "estudo_meio" | "ingles";
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
}

export const questionBank: Question[] = [
  // 1º ANO - PORTUGUÊS
  { id: "p1-1", school_year: "1", subject: "portugues", question_text: "Qual é a primeira letra do alfabeto?", options: ["B", "A", "C", "D"], correct_answer: 1, difficulty: 1 },
  { id: "p1-2", school_year: "1", subject: "portugues", question_text: "Quantas vogais existem?", options: ["3", "4", "5", "6"], correct_answer: 2, difficulty: 1 },
  { id: "p1-3", school_year: "1", subject: "portugues", question_text: "Qual destas palavras começa por 'M'?", options: ["Bola", "Casa", "Mãe", "Pão"], correct_answer: 2, difficulty: 1 },
  { id: "p1-4", school_year: "1", subject: "portugues", question_text: "O que é um nome próprio?", options: ["Nome de animais", "Nome de uma pessoa ou lugar", "Nome de objetos", "Nome de cores"], correct_answer: 1, difficulty: 1 },
  { id: "p1-5", school_year: "1", subject: "portugues", question_text: "Qual a última letra do alfabeto?", options: ["X", "W", "Z", "Y"], correct_answer: 2, difficulty: 1 },
  { id: "p1-6", school_year: "1", subject: "portugues", question_text: "A palavra 'gato' tem quantas sílabas?", options: ["1", "2", "3", "4"], correct_answer: 1, difficulty: 1 },
  { id: "p1-7", school_year: "1", subject: "portugues", question_text: "'Casa' rima com:", options: ["Gato", "Asa", "Bola", "Livro"], correct_answer: 1, difficulty: 1 },
  { id: "p1-8", school_year: "1", subject: "portugues", question_text: "Qual destas é uma vogal?", options: ["B", "C", "E", "D"], correct_answer: 2, difficulty: 1 },
  { id: "p1-9", school_year: "1", subject: "portugues", question_text: "O plural de 'flor' é:", options: ["Flores", "Flors", "Florais", "Flora"], correct_answer: 0, difficulty: 1 },
  { id: "p1-10", school_year: "1", subject: "portugues", question_text: "Qual frase está correta?", options: ["O gato é bonito.", "o gato é bonito", "O Gato é bonito", "o Gato É bonito"], correct_answer: 0, difficulty: 1 },

  // 1º ANO - MATEMÁTICA
  { id: "m1-1", school_year: "1", subject: "matematica", question_text: "Quanto é 2 + 3?", options: ["4", "5", "6", "7"], correct_answer: 1, difficulty: 1 },
  { id: "m1-2", school_year: "1", subject: "matematica", question_text: "Qual número vem depois do 9?", options: ["8", "11", "10", "12"], correct_answer: 2, difficulty: 1 },
  { id: "m1-3", school_year: "1", subject: "matematica", question_text: "Quanto é 5 - 2?", options: ["2", "3", "4", "1"], correct_answer: 1, difficulty: 1 },
  { id: "m1-4", school_year: "1", subject: "matematica", question_text: "Qual é maior: 7 ou 4?", options: ["4", "7", "São iguais", "Nenhum"], correct_answer: 1, difficulty: 1 },
  { id: "m1-5", school_year: "1", subject: "matematica", question_text: "Quantos lados tem um triângulo?", options: ["2", "3", "4", "5"], correct_answer: 1, difficulty: 1 },
  { id: "m1-6", school_year: "1", subject: "matematica", question_text: "Quanto é 1 + 1?", options: ["1", "2", "3", "0"], correct_answer: 1, difficulty: 1 },
  { id: "m1-7", school_year: "1", subject: "matematica", question_text: "Qual é o número par?", options: ["1", "3", "4", "5"], correct_answer: 2, difficulty: 1 },
  { id: "m1-8", school_year: "1", subject: "matematica", question_text: "Quanto é 10 - 5?", options: ["4", "5", "6", "3"], correct_answer: 1, difficulty: 1 },
  { id: "m1-9", school_year: "1", subject: "matematica", question_text: "Quantos lados tem um quadrado?", options: ["3", "4", "5", "6"], correct_answer: 1, difficulty: 1 },
  { id: "m1-10", school_year: "1", subject: "matematica", question_text: "Quanto é 6 + 4?", options: ["9", "10", "11", "8"], correct_answer: 1, difficulty: 1 },

  // 1º ANO - ESTUDO DO MEIO
  { id: "e1-1", school_year: "1", subject: "estudo_meio", question_text: "Qual é a capital de Portugal?", options: ["Porto", "Lisboa", "Coimbra", "Faro"], correct_answer: 1, difficulty: 1 },
  { id: "e1-2", school_year: "1", subject: "estudo_meio", question_text: "Quantas estações do ano existem?", options: ["2", "3", "4", "5"], correct_answer: 2, difficulty: 1 },
  { id: "e1-3", school_year: "1", subject: "estudo_meio", question_text: "Os peixes vivem:", options: ["Na terra", "No ar", "Na água", "Nas árvores"], correct_answer: 2, difficulty: 1 },
  { id: "e1-4", school_year: "1", subject: "estudo_meio", question_text: "Qual o sentido que usamos para ouvir?", options: ["Visão", "Olfato", "Audição", "Tato"], correct_answer: 2, difficulty: 1 },
  { id: "e1-5", school_year: "1", subject: "estudo_meio", question_text: "As plantas precisam de água?", options: ["Sim", "Não", "Às vezes", "Nunca"], correct_answer: 0, difficulty: 1 },

  // 2º ANO - PORTUGUÊS
  { id: "p2-1", school_year: "2", subject: "portugues", question_text: "Qual é o sinónimo de 'bonito'?", options: ["Feio", "Belo", "Triste", "Grande"], correct_answer: 1, difficulty: 2 },
  { id: "p2-2", school_year: "2", subject: "portugues", question_text: "O antónimo de 'grande' é:", options: ["Enorme", "Alto", "Pequeno", "Largo"], correct_answer: 2, difficulty: 2 },
  { id: "p2-3", school_year: "2", subject: "portugues", question_text: "Qual é o feminino de 'cão'?", options: ["Cãe", "Cadela", "Cãoa", "Canha"], correct_answer: 1, difficulty: 2 },
  { id: "p2-4", school_year: "2", subject: "portugues", question_text: "Na frase 'O João come pão', qual é o verbo?", options: ["João", "come", "pão", "O"], correct_answer: 1, difficulty: 2 },
  { id: "p2-5", school_year: "2", subject: "portugues", question_text: "O que é um adjetivo?", options: ["Uma ação", "Uma qualidade", "Uma pessoa", "Um lugar"], correct_answer: 1, difficulty: 2 },
  { id: "p2-6", school_year: "2", subject: "portugues", question_text: "'Brincar' é um:", options: ["Nome", "Adjetivo", "Verbo", "Pronome"], correct_answer: 2, difficulty: 2 },
  { id: "p2-7", school_year: "2", subject: "portugues", question_text: "O plural de 'animal' é:", options: ["Animals", "Animais", "Animales", "Animalos"], correct_answer: 1, difficulty: 2 },
  { id: "p2-8", school_year: "2", subject: "portugues", question_text: "Qual palavra está escrita corretamente?", options: ["Escula", "Escola", "Escolla", "Escóla"], correct_answer: 1, difficulty: 2 },
  { id: "p2-9", school_year: "2", subject: "portugues", question_text: "'Eu' é um:", options: ["Verbo", "Nome", "Pronome pessoal", "Adjetivo"], correct_answer: 2, difficulty: 2 },
  { id: "p2-10", school_year: "2", subject: "portugues", question_text: "Quantos parágrafos começa uma história normalmente?", options: ["Introdução, desenvolvimento e conclusão", "Só um", "Dois", "Depende"], correct_answer: 0, difficulty: 2 },

  // 2º ANO - MATEMÁTICA
  { id: "m2-1", school_year: "2", subject: "matematica", question_text: "Quanto é 15 + 8?", options: ["22", "23", "24", "21"], correct_answer: 1, difficulty: 2 },
  { id: "m2-2", school_year: "2", subject: "matematica", question_text: "Quanto é 3 × 4?", options: ["7", "10", "12", "14"], correct_answer: 2, difficulty: 2 },
  { id: "m2-3", school_year: "2", subject: "matematica", question_text: "Quanto é 20 - 7?", options: ["12", "13", "14", "11"], correct_answer: 1, difficulty: 2 },
  { id: "m2-4", school_year: "2", subject: "matematica", question_text: "Uma dúzia são quantos?", options: ["10", "12", "15", "6"], correct_answer: 1, difficulty: 2 },
  { id: "m2-5", school_year: "2", subject: "matematica", question_text: "Quanto é 2 × 5?", options: ["7", "8", "10", "12"], correct_answer: 2, difficulty: 2 },
  { id: "m2-6", school_year: "2", subject: "matematica", question_text: "Qual é metade de 10?", options: ["3", "4", "5", "6"], correct_answer: 2, difficulty: 2 },
  { id: "m2-7", school_year: "2", subject: "matematica", question_text: "Quanto é 50 + 25?", options: ["70", "75", "80", "65"], correct_answer: 1, difficulty: 2 },
  { id: "m2-8", school_year: "2", subject: "matematica", question_text: "Um retângulo tem quantos lados?", options: ["3", "4", "5", "6"], correct_answer: 1, difficulty: 2 },
  { id: "m2-9", school_year: "2", subject: "matematica", question_text: "Quanto é 100 - 50?", options: ["40", "50", "60", "45"], correct_answer: 1, difficulty: 2 },
  { id: "m2-10", school_year: "2", subject: "matematica", question_text: "Quanto é 6 × 2?", options: ["8", "10", "12", "14"], correct_answer: 2, difficulty: 2 },

  // 2º ANO - ESTUDO DO MEIO
  { id: "e2-1", school_year: "2", subject: "estudo_meio", question_text: "Qual rio passa em Lisboa?", options: ["Douro", "Mondego", "Tejo", "Guadiana"], correct_answer: 2, difficulty: 2 },
  { id: "e2-2", school_year: "2", subject: "estudo_meio", question_text: "Os mamíferos alimentam as crias com:", options: ["Água", "Leite", "Sumo", "Sementes"], correct_answer: 1, difficulty: 2 },
  { id: "e2-3", school_year: "2", subject: "estudo_meio", question_text: "O que é reciclagem?", options: ["Queimar lixo", "Transformar materiais para reutilizar", "Enterrar lixo", "Não fazer nada"], correct_answer: 1, difficulty: 2 },
  { id: "e2-4", school_year: "2", subject: "estudo_meio", question_text: "As aves têm o corpo coberto de:", options: ["Pelo", "Escamas", "Penas", "Pele"], correct_answer: 2, difficulty: 2 },
  { id: "e2-5", school_year: "2", subject: "estudo_meio", question_text: "Quantos dias tem uma semana?", options: ["5", "6", "7", "8"], correct_answer: 2, difficulty: 2 },

  // 3º ANO - PORTUGUÊS
  { id: "p3-1", school_year: "3", subject: "portugues", question_text: "O que é um determinante artigo?", options: ["Uma palavra que indica ação", "Uma palavra que acompanha o nome", "Uma palavra que descreve", "Uma palavra que liga frases"], correct_answer: 1, difficulty: 3 },
  { id: "p3-2", school_year: "3", subject: "portugues", question_text: "Qual é o sujeito na frase 'A Maria come fruta'?", options: ["come", "fruta", "A Maria", "A"], correct_answer: 2, difficulty: 3 },
  { id: "p3-3", school_year: "3", subject: "portugues", question_text: "O grau superlativo de 'bom' é:", options: ["Melhor", "Ótimo", "Bão", "Bonissimo"], correct_answer: 1, difficulty: 3 },
  { id: "p3-4", school_year: "3", subject: "portugues", question_text: "Que tipo de texto conta uma história?", options: ["Informativo", "Narrativo", "Poético", "Instrucional"], correct_answer: 1, difficulty: 3 },
  { id: "p3-5", school_year: "3", subject: "portugues", question_text: "Na frase 'Ele corre rápido', 'rápido' é:", options: ["Verbo", "Nome", "Advérbio", "Pronome"], correct_answer: 2, difficulty: 3 },

  // 3º ANO - MATEMÁTICA
  { id: "m3-1", school_year: "3", subject: "matematica", question_text: "Quanto é 125 × 3?", options: ["350", "375", "400", "325"], correct_answer: 1, difficulty: 3 },
  { id: "m3-2", school_year: "3", subject: "matematica", question_text: "Quanto é 1/4 de 100?", options: ["20", "25", "30", "50"], correct_answer: 1, difficulty: 3 },
  { id: "m3-3", school_year: "3", subject: "matematica", question_text: "Quantos centímetros tem 1 metro?", options: ["10", "50", "100", "1000"], correct_answer: 2, difficulty: 3 },
  { id: "m3-4", school_year: "3", subject: "matematica", question_text: "Quanto é 456 - 189?", options: ["267", "277", "257", "247"], correct_answer: 0, difficulty: 3 },
  { id: "m3-5", school_year: "3", subject: "matematica", question_text: "Qual é a terça parte de 15?", options: ["3", "5", "7", "10"], correct_answer: 1, difficulty: 3 },

  // 3º ANO - ESTUDO DO MEIO
  { id: "e3-1", school_year: "3", subject: "estudo_meio", question_text: "Portugal faz fronteira com:", options: ["França", "Espanha", "Itália", "Marrocos"], correct_answer: 1, difficulty: 3 },
  { id: "e3-2", school_year: "3", subject: "estudo_meio", question_text: "Qual é o maior rio de Portugal?", options: ["Mondego", "Douro", "Tejo", "Guadiana"], correct_answer: 2, difficulty: 3 },
  { id: "e3-3", school_year: "3", subject: "estudo_meio", question_text: "O sistema solar tem quantos planetas?", options: ["7", "8", "9", "10"], correct_answer: 1, difficulty: 3 },
  { id: "e3-4", school_year: "3", subject: "estudo_meio", question_text: "Qual é a serra mais alta de Portugal continental?", options: ["Serra da Estrela", "Serra do Gerês", "Serra da Arrábida", "Serra de Sintra"], correct_answer: 0, difficulty: 3 },
  { id: "e3-5", school_year: "3", subject: "estudo_meio", question_text: "Os arquipélagos portugueses são:", options: ["Açores e Canárias", "Madeira e Baleares", "Açores e Madeira", "Canárias e Madeira"], correct_answer: 2, difficulty: 3 },

  // 3º ANO - INGLÊS
  { id: "i3-1", school_year: "3", subject: "ingles", question_text: "How do you say 'olá' in English?", options: ["Goodbye", "Hello", "Please", "Thank you"], correct_answer: 1, difficulty: 3 },
  { id: "i3-2", school_year: "3", subject: "ingles", question_text: "What color is the sky?", options: ["Red", "Green", "Blue", "Yellow"], correct_answer: 2, difficulty: 3 },
  { id: "i3-3", school_year: "3", subject: "ingles", question_text: "How many days are in a week?", options: ["Five", "Six", "Seven", "Eight"], correct_answer: 2, difficulty: 3 },
  { id: "i3-4", school_year: "3", subject: "ingles", question_text: "What is 'gato' in English?", options: ["Dog", "Cat", "Bird", "Fish"], correct_answer: 1, difficulty: 3 },
  { id: "i3-5", school_year: "3", subject: "ingles", question_text: "What do you say when someone gives you something?", options: ["Sorry", "Hello", "Thank you", "Goodbye"], correct_answer: 2, difficulty: 3 },

  // 4º ANO - PORTUGUÊS
  { id: "p4-1", school_year: "4", subject: "portugues", question_text: "O que é uma frase complexa?", options: ["Frase com uma oração", "Frase com duas ou mais orações", "Frase sem verbo", "Frase interrogativa"], correct_answer: 1, difficulty: 4 },
  { id: "p4-2", school_year: "4", subject: "portugues", question_text: "Qual é o complemento direto na frase 'Eu li o livro'?", options: ["Eu", "li", "o livro", "o"], correct_answer: 2, difficulty: 4 },
  { id: "p4-3", school_year: "4", subject: "portugues", question_text: "O que é uma preposição?", options: ["Palavra que liga elementos", "Palavra que descreve", "Palavra que substitui o nome", "Palavra que indica ação"], correct_answer: 0, difficulty: 4 },
  { id: "p4-4", school_year: "4", subject: "portugues", question_text: "Qual destes é um texto argumentativo?", options: ["Uma receita", "Um poema", "Uma carta de opinião", "Uma lenda"], correct_answer: 2, difficulty: 4 },
  { id: "p4-5", school_year: "4", subject: "portugues", question_text: "O pretérito perfeito indica:", options: ["Ação no futuro", "Ação no presente", "Ação no passado já concluída", "Ação habitual"], correct_answer: 2, difficulty: 4 },

  // 4º ANO - MATEMÁTICA
  { id: "m4-1", school_year: "4", subject: "matematica", question_text: "Quanto é 3456 ÷ 12?", options: ["278", "288", "298", "308"], correct_answer: 1, difficulty: 4 },
  { id: "m4-2", school_year: "4", subject: "matematica", question_text: "Qual é a área de um retângulo com 5cm × 8cm?", options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"], correct_answer: 2, difficulty: 4 },
  { id: "m4-3", school_year: "4", subject: "matematica", question_text: "Quanto é 0,5 + 0,75?", options: ["1,00", "1,25", "1,50", "0,125"], correct_answer: 1, difficulty: 4 },
  { id: "m4-4", school_year: "4", subject: "matematica", question_text: "Qual fração é equivalente a 1/2?", options: ["2/3", "3/6", "1/4", "2/5"], correct_answer: 1, difficulty: 4 },
  { id: "m4-5", school_year: "4", subject: "matematica", question_text: "Quantos graus tem um ângulo reto?", options: ["45°", "60°", "90°", "180°"], correct_answer: 2, difficulty: 4 },

  // 4º ANO - ESTUDO DO MEIO
  { id: "e4-1", school_year: "4", subject: "estudo_meio", question_text: "Em que ano foi a Revolução dos Cravos?", options: ["1964", "1974", "1984", "1994"], correct_answer: 1, difficulty: 4 },
  { id: "e4-2", school_year: "4", subject: "estudo_meio", question_text: "Quem foi o primeiro rei de Portugal?", options: ["D. Sancho I", "D. Afonso Henriques", "D. Dinis", "D. Manuel I"], correct_answer: 1, difficulty: 4 },
  { id: "e4-3", school_year: "4", subject: "estudo_meio", question_text: "O que são energias renováveis?", options: ["Petróleo e gás", "Solar, eólica e hídrica", "Carvão e nuclear", "Nenhuma das anteriores"], correct_answer: 1, difficulty: 4 },
  { id: "e4-4", school_year: "4", subject: "estudo_meio", question_text: "Qual península está Portugal?", options: ["Itálica", "Balcânica", "Ibérica", "Escandinava"], correct_answer: 2, difficulty: 4 },
  { id: "e4-5", school_year: "4", subject: "estudo_meio", question_text: "Os Descobrimentos Portugueses começaram no século:", options: ["XIII", "XIV", "XV", "XVI"], correct_answer: 2, difficulty: 4 },

  // 4º ANO - INGLÊS
  { id: "i4-1", school_year: "4", subject: "ingles", question_text: "What is the past tense of 'go'?", options: ["Goed", "Gone", "Went", "Going"], correct_answer: 2, difficulty: 4 },
  { id: "i4-2", school_year: "4", subject: "ingles", question_text: "How do you say 'eu gosto' in English?", options: ["I want", "I like", "I have", "I need"], correct_answer: 1, difficulty: 4 },
  { id: "i4-3", school_year: "4", subject: "ingles", question_text: "Which is a fruit?", options: ["Carrot", "Potato", "Apple", "Lettuce"], correct_answer: 2, difficulty: 4 },
  { id: "i4-4", school_year: "4", subject: "ingles", question_text: "What month comes after March?", options: ["February", "April", "May", "June"], correct_answer: 1, difficulty: 4 },
  { id: "i4-5", school_year: "4", subject: "ingles", question_text: "Complete: 'She ___ a student.'", options: ["am", "is", "are", "be"], correct_answer: 1, difficulty: 4 },
];

export const getQuestionsByYear = (year: string) => 
  questionBank.filter(q => q.school_year === year);

export const getQuestionsByYearAndSubject = (year: string, subject: string) =>
  questionBank.filter(q => q.school_year === year && q.subject === subject);

export const getRandomQuestions = (year: string, count: number, subjectWeights?: Record<string, number>) => {
  const yearQuestions = getQuestionsByYear(year);
  
  if (!subjectWeights) {
    const shuffled = [...yearQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // Weighted selection based on subject priorities
  const weighted: Question[] = [];
  const totalWeight = Object.values(subjectWeights).reduce((a, b) => a + b, 0);
  
  for (const [subject, weight] of Object.entries(subjectWeights)) {
    const subjectQuestions = yearQuestions.filter(q => q.subject === subject);
    const subjectCount = Math.round((weight / totalWeight) * count);
    const shuffled = [...subjectQuestions].sort(() => Math.random() - 0.5);
    weighted.push(...shuffled.slice(0, subjectCount));
  }

  // Fill remaining if needed
  while (weighted.length < count) {
    const remaining = yearQuestions.filter(q => !weighted.includes(q));
    if (remaining.length === 0) break;
    weighted.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  return weighted.sort(() => Math.random() - 0.5).slice(0, count);
};
