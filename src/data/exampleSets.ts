// Built-in example Text Match sets, used to seed the app for testing/demo
// purposes. Each mirrors the same three themes across French, Italian and
// Spanish so year-group progression is easy to compare:
//   Year 7  — numbers, colours & classroom basics
//   Year 9  — free time, family & daily routine
//   Year 11 — GCSE higher-tier themes (environment, future, work, opinions)

export interface ExamplePair {
  left: string;
  right: string;
}

export interface ExampleSet {
  title: string;
  leftLabel: string;
  rightLabel: string;
  pairs: ExamplePair[];
}

const french7: ExamplePair[] = [
  { left: "un", right: "one" },
  { left: "deux", right: "two" },
  { left: "trois", right: "three" },
  { left: "quatre", right: "four" },
  { left: "cinq", right: "five" },
  { left: "six", right: "six" },
  { left: "sept", right: "seven" },
  { left: "huit", right: "eight" },
  { left: "neuf", right: "nine" },
  { left: "dix", right: "ten" },
  { left: "rouge", right: "red" },
  { left: "bleu", right: "blue" },
  { left: "vert", right: "green" },
  { left: "jaune", right: "yellow" },
  { left: "noir", right: "black" },
  { left: "blanc", right: "white" },
  { left: "un stylo", right: "a pen" },
  { left: "un livre", right: "a book" },
  { left: "une table", right: "a table" },
  { left: "un professeur", right: "a teacher" },
];

const french9: ExamplePair[] = [
  { left: "je vais à l'école", right: "I go to school" },
  { left: "je joue au football", right: "I play football" },
  { left: "je regarde la télé", right: "I watch TV" },
  { left: "je me lève à sept heures", right: "I get up at seven o'clock" },
  { left: "mon frère", right: "my brother" },
  { left: "ma sœur", right: "my sister" },
  { left: "ma mère", right: "my mother" },
  { left: "mon père", right: "my father" },
  { left: "j'aime", right: "I like" },
  { left: "je n'aime pas", right: "I don't like" },
  { left: "le samedi", right: "on Saturdays" },
  { left: "le matin", right: "in the morning" },
  { left: "le soir", right: "in the evening" },
  { left: "je fais mes devoirs", right: "I do my homework" },
  { left: "j'écoute de la musique", right: "I listen to music" },
  { left: "je sors avec mes amis", right: "I go out with my friends" },
  { left: "d'habitude", right: "usually" },
  { left: "souvent", right: "often" },
];

const french11: ExamplePair[] = [
  { left: "à mon avis", right: "in my opinion" },
  { left: "je voudrais devenir", right: "I would like to become" },
  { left: "le changement climatique", right: "climate change" },
  { left: "à l'avenir, je vais", right: "in the future, I am going to" },
  { left: "je n'ai jamais", right: "I have never" },
  { left: "le chômage", right: "unemployment" },
  { left: "pour protéger l'environnement", right: "in order to protect the environment" },
  { left: "bien que", right: "although" },
  { left: "par contre", right: "on the other hand" },
  { left: "les réseaux sociaux", right: "social media" },
  { left: "de nos jours", right: "nowadays" },
  { left: "les avantages et les inconvénients", right: "advantages and disadvantages" },
  { left: "un mode de vie sain", right: "a healthy lifestyle" },
  { left: "réduire la pollution", right: "to reduce pollution" },
  { left: "si j'avais plus d'argent, je...", right: "if I had more money, I would..." },
  { left: "un stage", right: "work experience" },
  { left: "de plus en plus", right: "more and more" },
  { left: "il faut", right: "it is necessary to" },
];

const italian7: ExamplePair[] = [
  { left: "uno", right: "one" },
  { left: "due", right: "two" },
  { left: "tre", right: "three" },
  { left: "quattro", right: "four" },
  { left: "cinque", right: "five" },
  { left: "sei", right: "six" },
  { left: "sette", right: "seven" },
  { left: "otto", right: "eight" },
  { left: "nove", right: "nine" },
  { left: "dieci", right: "ten" },
  { left: "rosso", right: "red" },
  { left: "blu", right: "blue" },
  { left: "verde", right: "green" },
  { left: "giallo", right: "yellow" },
  { left: "nero", right: "black" },
  { left: "bianco", right: "white" },
  { left: "una penna", right: "a pen" },
  { left: "un libro", right: "a book" },
  { left: "un tavolo", right: "a table" },
  { left: "un insegnante", right: "a teacher" },
];

const italian9: ExamplePair[] = [
  { left: "vado a scuola", right: "I go to school" },
  { left: "gioco a calcio", right: "I play football" },
  { left: "guardo la TV", right: "I watch TV" },
  { left: "mi alzo alle sette", right: "I get up at seven o'clock" },
  { left: "mio fratello", right: "my brother" },
  { left: "mia sorella", right: "my sister" },
  { left: "mia madre", right: "my mother" },
  { left: "mio padre", right: "my father" },
  { left: "mi piace", right: "I like" },
  { left: "non mi piace", right: "I don't like" },
  { left: "il sabato", right: "on Saturdays" },
  { left: "la mattina", right: "in the morning" },
  { left: "la sera", right: "in the evening" },
  { left: "faccio i compiti", right: "I do my homework" },
  { left: "ascolto la musica", right: "I listen to music" },
  { left: "esco con i miei amici", right: "I go out with my friends" },
  { left: "di solito", right: "usually" },
  { left: "spesso", right: "often" },
];

const italian11: ExamplePair[] = [
  { left: "secondo me", right: "in my opinion" },
  { left: "vorrei diventare", right: "I would like to become" },
  { left: "il cambiamento climatico", right: "climate change" },
  { left: "in futuro, andrò a", right: "in the future, I am going to" },
  { left: "non ho mai", right: "I have never" },
  { left: "la disoccupazione", right: "unemployment" },
  { left: "per proteggere l'ambiente", right: "in order to protect the environment" },
  { left: "sebbene", right: "although" },
  { left: "d'altra parte", right: "on the other hand" },
  { left: "i social media", right: "social media" },
  { left: "al giorno d'oggi", right: "nowadays" },
  { left: "i vantaggi e gli svantaggi", right: "advantages and disadvantages" },
  { left: "uno stile di vita sano", right: "a healthy lifestyle" },
  { left: "ridurre l'inquinamento", right: "to reduce pollution" },
  { left: "se avessi più soldi, ...", right: "if I had more money, I would..." },
  { left: "uno stage", right: "work experience" },
  { left: "sempre di più", right: "more and more" },
  { left: "bisogna", right: "it is necessary to" },
];

const spanish7: ExamplePair[] = [
  { left: "uno", right: "one" },
  { left: "dos", right: "two" },
  { left: "tres", right: "three" },
  { left: "cuatro", right: "four" },
  { left: "cinco", right: "five" },
  { left: "seis", right: "six" },
  { left: "siete", right: "seven" },
  { left: "ocho", right: "eight" },
  { left: "nueve", right: "nine" },
  { left: "diez", right: "ten" },
  { left: "rojo", right: "red" },
  { left: "azul", right: "blue" },
  { left: "verde", right: "green" },
  { left: "amarillo", right: "yellow" },
  { left: "negro", right: "black" },
  { left: "blanco", right: "white" },
  { left: "un bolígrafo", right: "a pen" },
  { left: "un libro", right: "a book" },
  { left: "una mesa", right: "a table" },
  { left: "un profesor", right: "a teacher" },
];

const spanish9: ExamplePair[] = [
  { left: "voy al colegio", right: "I go to school" },
  { left: "juego al fútbol", right: "I play football" },
  { left: "veo la tele", right: "I watch TV" },
  { left: "me levanto a las siete", right: "I get up at seven o'clock" },
  { left: "mi hermano", right: "my brother" },
  { left: "mi hermana", right: "my sister" },
  { left: "mi madre", right: "my mother" },
  { left: "mi padre", right: "my father" },
  { left: "me gusta", right: "I like" },
  { left: "no me gusta", right: "I don't like" },
  { left: "los sábados", right: "on Saturdays" },
  { left: "por la mañana", right: "in the morning" },
  { left: "por la tarde", right: "in the evening" },
  { left: "hago los deberes", right: "I do my homework" },
  { left: "escucho música", right: "I listen to music" },
  { left: "salgo con mis amigos", right: "I go out with my friends" },
  { left: "normalmente", right: "usually" },
  { left: "a menudo", right: "often" },
];

const spanish11: ExamplePair[] = [
  { left: "en mi opinión", right: "in my opinion" },
  { left: "me gustaría ser", right: "I would like to become" },
  { left: "el cambio climático", right: "climate change" },
  { left: "en el futuro, voy a", right: "in the future, I am going to" },
  { left: "nunca he", right: "I have never" },
  { left: "el desempleo", right: "unemployment" },
  { left: "para proteger el medio ambiente", right: "in order to protect the environment" },
  { left: "aunque", right: "although" },
  { left: "por otro lado", right: "on the other hand" },
  { left: "las redes sociales", right: "social media" },
  { left: "hoy en día", right: "nowadays" },
  { left: "las ventajas y las desventajas", right: "advantages and disadvantages" },
  { left: "un estilo de vida sano", right: "a healthy lifestyle" },
  { left: "reducir la contaminación", right: "to reduce pollution" },
  { left: "si tuviera más dinero, ...", right: "if I had more money, I would..." },
  { left: "las prácticas laborales", right: "work experience" },
  { left: "cada vez más", right: "more and more" },
  { left: "hay que", right: "it is necessary to" },
];

export const exampleSets: ExampleSet[] = [
  { title: "Year 7 French: Numbers, Colours & Classroom", leftLabel: "French", rightLabel: "English", pairs: french7 },
  { title: "Year 9 French: Free Time, Family & Routine", leftLabel: "French", rightLabel: "English", pairs: french9 },
  { title: "Year 11 French: GCSE Themes (Environment, Future & Work)", leftLabel: "French", rightLabel: "English", pairs: french11 },

  { title: "Year 7 Italian: Numbers, Colours & Classroom", leftLabel: "Italian", rightLabel: "English", pairs: italian7 },
  { title: "Year 9 Italian: Free Time, Family & Routine", leftLabel: "Italian", rightLabel: "English", pairs: italian9 },
  { title: "Year 11 Italian: GCSE Themes (Environment, Future & Work)", leftLabel: "Italian", rightLabel: "English", pairs: italian11 },

  { title: "Year 7 Spanish: Numbers, Colours & Classroom", leftLabel: "Spanish", rightLabel: "English", pairs: spanish7 },
  { title: "Year 9 Spanish: Free Time, Family & Routine", leftLabel: "Spanish", rightLabel: "English", pairs: spanish9 },
  { title: "Year 11 Spanish: GCSE Themes (Environment, Future & Work)", leftLabel: "Spanish", rightLabel: "English", pairs: spanish11 },
];
