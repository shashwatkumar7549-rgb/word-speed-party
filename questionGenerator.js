const pool = [
  { id:"capital-france", prompt:"What is the capital city of France?", answer:"Paris", accepted:["Paris"] },
  { id:"planet-red", prompt:"Which planet is known as the Red Planet?", answer:"Mars", accepted:["Mars"] },
  { id:"largest-ocean", prompt:"What is the largest ocean on Earth?", answer:"Pacific Ocean", accepted:["Pacific Ocean","Pacific"] },
  { id:"chemical-water", prompt:"What is the chemical formula for water?", answer:"H2O", accepted:["H2O","H₂O"] },
  { id:"moon-earth", prompt:"What is the name of Earth's natural satellite?", answer:"Moon", accepted:["Moon","the Moon"] },
  { id:"author-hamlet", prompt:"Who wrote the play Hamlet?", answer:"William Shakespeare", accepted:["William Shakespeare","Shakespeare"] },
  { id:"fastest-land", prompt:"What is the fastest land animal?", answer:"Cheetah", accepted:["Cheetah","the cheetah"] },
  { id:"continents", prompt:"How many continents are commonly recognized on Earth?", answer:"7", accepted:["7","seven"] },
  { id:"gold-symbol", prompt:"What is the chemical symbol for gold?", answer:"Au", accepted:["Au","au"] },
  { id:"largest-mammal", prompt:"What is the largest mammal on Earth?", answer:"Blue whale", accepted:["Blue whale","blue whale"] },
  { id:"jupiter-moons", prompt:"Which planet is the largest in our solar system?", answer:"Jupiter", accepted:["Jupiter"] },
  { id:"everest", prompt:"What is the highest mountain above sea level?", answer:"Mount Everest", accepted:["Mount Everest","Everest"] },
  { id:"india-capital", prompt:"What is the capital of India?", answer:"New Delhi", accepted:["New Delhi","Delhi"] },
  { id:"language-brazil", prompt:"What is the official language of Brazil?", answer:"Portuguese", accepted:["Portuguese"] },
  { id:"red-white", prompt:"Which country is famous for the red-and-white maple leaf flag?", answer:"Canada", accepted:["Canada"] },
  { id:"photosynthesis", prompt:"What process do plants use to convert light energy into chemical energy?", answer:"Photosynthesis", accepted:["Photosynthesis"] },
  { id:"human-heart", prompt:"How many chambers does the human heart have?", answer:"4", accepted:["4","four"] },
  { id:"square-five", prompt:"What is 5 squared?", answer:"25", accepted:["25","twenty five","twenty-five"] },
  { id:"days-year", prompt:"How many days are in a non-leap year?", answer:"365", accepted:["365","three hundred sixty five","three hundred sixty-five"] },
  { id:"largest-desert", prompt:"What is the largest hot desert in the world?", answer:"Sahara Desert", accepted:["Sahara Desert","Sahara"] },
  { id:"currency-japan", prompt:"What is the currency of Japan?", answer:"Yen", accepted:["Yen","Japanese yen"] },
  { id:"gravity", prompt:"Which force pulls objects toward Earth?", answer:"Gravity", accepted:["Gravity"] },
  { id:"olympic-rings", prompt:"How many rings are on the Olympic symbol?", answer:"5", accepted:["5","five"] },
  { id:"tallest-animal", prompt:"What is the tallest living animal?", answer:"Giraffe", accepted:["Giraffe","the giraffe"] },
  { id:"saturn-rings", prompt:"Which planet is famous for its prominent ring system?", answer:"Saturn", accepted:["Saturn"] },
  { id:"author-1984", prompt:"Who wrote the novel 1984?", answer:"George Orwell", accepted:["George Orwell","Orwell"] },
  { id:"speed-light", prompt:"What travels fastest in a vacuum?", answer:"Light", accepted:["Light","light"] },
  { id:"largest-country", prompt:"What is the largest country by land area?", answer:"Russia", accepted:["Russia"] },
  { id:"primary-color", prompt:"Which primary color is produced by combining blue and yellow paint?", answer:"Green", accepted:["Green"] },
  { id:"binary", prompt:"What number does binary '10' represent in decimal?", answer:"2", accepted:["2","two"] },
  { id:"vitamin-sun", prompt:"Which vitamin is commonly produced by the skin in sunlight?", answer:"Vitamin D", accepted:["Vitamin D","D"] },
  { id:"shakespeare", prompt:"Which English playwright is often called the Bard of Avon?", answer:"William Shakespeare", accepted:["William Shakespeare","Shakespeare"] },
  { id:"pacific", prompt:"Which ocean lies between Asia and North America?", answer:"Pacific Ocean", accepted:["Pacific Ocean","Pacific"] },
  { id:"egypt", prompt:"In which country are the Great Pyramids of Giza?", answer:"Egypt", accepted:["Egypt"] },
  { id:"dna", prompt:"What molecule carries most genetic information in living organisms?", answer:"DNA", accepted:["DNA","Deoxyribonucleic acid"] },
  { id:"currency-uk", prompt:"What is the currency of the United Kingdom?", answer:"Pound sterling", accepted:["Pound sterling","pound","British pound"] },
  { id:"earth-sun", prompt:"What star does Earth orbit?", answer:"The Sun", accepted:["Sun","the Sun"] },
  { id:"hexagon", prompt:"How many sides does a hexagon have?", answer:"6", accepted:["6","six"] },
  { id:"chess", prompt:"How many squares are on a standard chessboard?", answer:"64", accepted:["64","sixty four","sixty-four"] },
  { id:"largest-organ", prompt:"What is the largest organ of the human body?", answer:"Skin", accepted:["Skin","the skin"] }
];


const extra = [
  ["largest-island","What is the largest island in the world?","Greenland",["Greenland"]],
  ["boiling-water","At what temperature does water boil at sea level in Celsius?","100",["100","one hundred"]],
  ["rainbow","How many colors are traditionally named in a rainbow?","7",["7","seven"]],
  ["spider-legs","How many legs does a spider have?","8",["8","eight"]],
  ["months-year","How many months are in a year?","12",["12","twelve"]],
  ["great-wall","In which country is the Great Wall located?","China",["China"]],
  ["currency-india","What is the currency of India?","Rupee",["Rupee","Indian rupee"]],
  ["largest-continent","What is the largest continent by land area?","Asia",["Asia"]],
  ["smallest-prime","What is the smallest prime number?","2",["2","two"]],
  ["human-teeth","How many permanent teeth does a typical adult human have?","32",["32","thirty two","thirty-two"]],
  ["kangaroo","Which country is strongly associated with the kangaroo?","Australia",["Australia"]],
  ["telescope","Which instrument is used to observe distant stars and planets?","Telescope",["Telescope","a telescope"]],
  ["venus-size","Which planet is closest in size to Earth?","Venus",["Venus"]],
  ["amazon-river","Which river carries the greatest volume of water?","Amazon River",["Amazon River","Amazon"]],
  ["mariana","What is the deepest ocean trench known on Earth?","Mariana Trench",["Mariana Trench"]],
  ["nile","Which river is traditionally regarded as the longest river in Africa?","Nile",["Nile","Nile River"]],
  ["force-unit","What is the SI unit of force?","Newton",["Newton"]],
  ["cocoa","What plant is the main source of cocoa beans?","Cacao",["Cacao","cacao tree"]],
  ["antarctica","Which continent surrounds the South Pole?","Antarctica",["Antarctica"]]
].map(([id,prompt,answer,accepted])=>({id,prompt,answer,accepted}));
pool.push(...extra);

export function generateQuestion(used) {
  const available = pool.filter(q => !used.has(q.id));
  if (!available.length) throw new Error("Question pool exhausted.");
  const q = available[Math.floor(Math.random() * available.length)];
  return { ...q };
}
