'use strict';

const { initDatabase, getDb } = require('./database');

function getTier(overall) {
  return overall >= 91 ? 'elite' : overall >= 85 ? 'gold' : overall >= 71 ? 'silver' : 'bronze';
}

function s(pace, shooting, passing, dribbling, defending, physical) {
  return JSON.stringify({ pace, shooting, passing, dribbling, defending, physical });
}

// ============================================================
// SUPER LIG (Turkey) - 85 players
// ============================================================
const superLig = [
  // Galatasaray
  { name: "Fernando Muslera", position: "GK", nationality: "Uruguay", nationality_flag: "UY", club: "Galatasaray", league: "Super Lig", overall: 80, stats: s(42, 18, 38, 22, 20, 68) },
  { name: "Mauro Icardi", position: "ST", nationality: "Argentina", nationality_flag: "AR", club: "Galatasaray", league: "Super Lig", overall: 84, stats: s(72, 86, 58, 78, 30, 74) },
  { name: "Dries Mertens", position: "CF", nationality: "Belgium", nationality_flag: "BE", club: "Galatasaray", league: "Super Lig", overall: 82, stats: s(73, 82, 80, 84, 32, 56) },
  { name: "Hakim Ziyech", position: "RW", nationality: "Morocco", nationality_flag: "MA", club: "Galatasaray", league: "Super Lig", overall: 82, stats: s(70, 78, 84, 85, 34, 58) },
  { name: "Lucas Torreira", position: "CDM", nationality: "Uruguay", nationality_flag: "UY", club: "Galatasaray", league: "Super Lig", overall: 81, stats: s(64, 62, 76, 74, 82, 72) },
  { name: "Davinson Sanchez", position: "CB", nationality: "Colombia", nationality_flag: "CO", club: "Galatasaray", league: "Super Lig", overall: 78, stats: s(72, 32, 48, 44, 80, 82) },
  { name: "Kerem Akturkoglu", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 79, stats: s(86, 72, 68, 80, 30, 62) },
  { name: "Abdulkerim Bardakci", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 78, stats: s(58, 38, 54, 48, 80, 78) },
  { name: "Kaan Ayhan", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 76, stats: s(56, 40, 58, 50, 78, 76) },
  { name: "Sergio Oliveira", position: "CM", nationality: "Portugal", nationality_flag: "PT", club: "Galatasaray", league: "Super Lig", overall: 79, stats: s(58, 74, 78, 74, 66, 70) },
  // Fenerbahce
  { name: "Dominik Livakovic", position: "GK", nationality: "Croatia", nationality_flag: "HR", club: "Fenerbahce", league: "Super Lig", overall: 83, stats: s(44, 16, 40, 20, 18, 72) },
  { name: "Edin Dzeko", position: "ST", nationality: "Bosnia", nationality_flag: "BA", club: "Fenerbahce", league: "Super Lig", overall: 80, stats: s(54, 82, 70, 74, 38, 78) },
  { name: "Dusan Tadic", position: "CAM", nationality: "Serbia", nationality_flag: "RS", club: "Fenerbahce", league: "Super Lig", overall: 81, stats: s(60, 76, 82, 82, 40, 62) },
  { name: "Sebastian Szymanski", position: "CAM", nationality: "Poland", nationality_flag: "PL", club: "Fenerbahce", league: "Super Lig", overall: 79, stats: s(68, 74, 78, 80, 36, 58) },
  { name: "Michy Batshuayi", position: "ST", nationality: "Belgium", nationality_flag: "BE", club: "Fenerbahce", league: "Super Lig", overall: 76, stats: s(76, 78, 52, 72, 26, 74) },
  { name: "Ismail Yuksek", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 76, stats: s(70, 60, 72, 72, 74, 72) },
  { name: "Bright Osayi-Samuel", position: "RWB", nationality: "Nigeria", nationality_flag: "NG", club: "Fenerbahce", league: "Super Lig", overall: 77, stats: s(88, 58, 62, 76, 68, 76) },
  { name: "Caglar Soyuncu", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 77, stats: s(62, 34, 48, 44, 78, 80) },
  { name: "Ferdi Kadioglu", position: "LB", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 78, stats: s(82, 56, 72, 76, 72, 68) },
  { name: "Irfan Can Kahveci", position: "RM", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 78, stats: s(72, 76, 74, 78, 38, 64) },
  // Besiktas
  { name: "Gedson Fernandes", position: "CM", nationality: "Portugal", nationality_flag: "PT", club: "Besiktas", league: "Super Lig", overall: 77, stats: s(74, 66, 72, 76, 68, 76) },
  { name: "Cenk Tosun", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Besiktas", league: "Super Lig", overall: 74, stats: s(64, 76, 56, 66, 28, 72) },
  { name: "Rachid Ghezzal", position: "RW", nationality: "Algeria", nationality_flag: "DZ", club: "Besiktas", league: "Super Lig", overall: 76, stats: s(76, 72, 74, 80, 28, 56) },
  { name: "Milot Rashica", position: "LW", nationality: "Kosovo", nationality_flag: "XK", club: "Besiktas", league: "Super Lig", overall: 75, stats: s(82, 72, 64, 78, 26, 58) },
  { name: "Mert Gunok", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Besiktas", league: "Super Lig", overall: 79, stats: s(40, 14, 36, 18, 16, 66) },
  { name: "Romain Saiss", position: "CB", nationality: "Morocco", nationality_flag: "MA", club: "Besiktas", league: "Super Lig", overall: 77, stats: s(52, 40, 56, 50, 78, 80) },
  { name: "Arthur Masuaku", position: "LB", nationality: "DR Congo", nationality_flag: "CD", club: "Besiktas", league: "Super Lig", overall: 73, stats: s(78, 42, 62, 70, 68, 72) },
  // Trabzonspor
  { name: "Ugurcan Cakir", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Trabzonspor", league: "Super Lig", overall: 80, stats: s(42, 16, 38, 20, 18, 70) },
  { name: "Anastasios Bakasetas", position: "CAM", nationality: "Greece", nationality_flag: "GR", club: "Trabzonspor", league: "Super Lig", overall: 76, stats: s(58, 74, 76, 74, 42, 64) },
  { name: "Trezeguet", position: "LW", nationality: "Egypt", nationality_flag: "EG", club: "Trabzonspor", league: "Super Lig", overall: 75, stats: s(82, 70, 64, 78, 28, 60) },
  { name: "Enis Bardhi", position: "CM", nationality: "North Macedonia", nationality_flag: "MK", club: "Trabzonspor", league: "Super Lig", overall: 76, stats: s(62, 72, 76, 74, 54, 66) },
  // Basaksehir
  { name: "Nacer Chadli", position: "LM", nationality: "Belgium", nationality_flag: "BE", club: "Basaksehir", league: "Super Lig", overall: 73, stats: s(70, 68, 70, 74, 40, 64) },
  { name: "Serdar Gurler", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Basaksehir", league: "Super Lig", overall: 72, stats: s(78, 66, 60, 74, 26, 58) },
  // Adana Demirspor
  { name: "Younes Belhanda", position: "CAM", nationality: "Morocco", nationality_flag: "MA", club: "Adana Demirspor", league: "Super Lig", overall: 74, stats: s(58, 70, 74, 76, 40, 60) },
  { name: "Britt Assombalonga", position: "ST", nationality: "DR Congo", nationality_flag: "CD", club: "Adana Demirspor", league: "Super Lig", overall: 71, stats: s(72, 72, 48, 68, 26, 72) },
  // Antalyaspor
  { name: "Haji Wright", position: "ST", nationality: "USA", nationality_flag: "US", club: "Antalyaspor", league: "Super Lig", overall: 73, stats: s(74, 74, 50, 68, 28, 76) },
  { name: "Lukas Podolski", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Antalyaspor", league: "Super Lig", overall: 70, stats: s(56, 76, 64, 68, 24, 66) },
  // Sivasspor
  { name: "Max Gradel", position: "LW", nationality: "Ivory Coast", nationality_flag: "CI", club: "Sivasspor", league: "Super Lig", overall: 72, stats: s(76, 70, 62, 76, 28, 62) },
  { name: "Erdogan Yesilyurt", position: "CDM", nationality: "Turkey", nationality_flag: "TR", club: "Sivasspor", league: "Super Lig", overall: 68, stats: s(58, 48, 62, 60, 70, 72) },
  // Konyaspor
  { name: "Marko Jevtovic", position: "CDM", nationality: "Serbia", nationality_flag: "RS", club: "Konyaspor", league: "Super Lig", overall: 71, stats: s(56, 52, 66, 62, 74, 76) },
  { name: "Abdulkadir Parmak", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Konyaspor", league: "Super Lig", overall: 69, stats: s(64, 56, 66, 66, 60, 66) },
  // Kasimpasa
  { name: "Haris Hajradinovic", position: "RW", nationality: "Bosnia", nationality_flag: "BA", club: "Kasimpasa", league: "Super Lig", overall: 72, stats: s(76, 68, 66, 76, 26, 58) },
  { name: "Umut Bozok", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Kasimpasa", league: "Super Lig", overall: 73, stats: s(78, 74, 50, 68, 24, 68) },
  // Gaziantep FK
  { name: "Alexandru Maxim", position: "CAM", nationality: "Romania", nationality_flag: "RO", club: "Gaziantep FK", league: "Super Lig", overall: 74, stats: s(62, 72, 76, 76, 36, 58) },
  { name: "Kenan Karaman", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Gaziantep FK", league: "Super Lig", overall: 72, stats: s(70, 70, 58, 68, 32, 74) },
  // Kayserispor
  { name: "Mario Balotelli", position: "ST", nationality: "Italy", nationality_flag: "IT", club: "Kayserispor", league: "Super Lig", overall: 74, stats: s(66, 80, 58, 72, 24, 78) },
  { name: "Carlos Mane", position: "LW", nationality: "Portugal", nationality_flag: "PT", club: "Kayserispor", league: "Super Lig", overall: 70, stats: s(82, 62, 56, 74, 22, 56) },
  // Hatayspor
  { name: "Aaron Boupendza", position: "ST", nationality: "Gabon", nationality_flag: "GA", club: "Hatayspor", league: "Super Lig", overall: 74, stats: s(82, 76, 48, 72, 24, 74) },
  // Alanyaspor
  { name: "Efecan Karaca", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Alanyaspor", league: "Super Lig", overall: 71, stats: s(80, 66, 60, 74, 24, 56) },
  { name: "Famara Diedhiou", position: "ST", nationality: "Senegal", nationality_flag: "SN", club: "Alanyaspor", league: "Super Lig", overall: 72, stats: s(60, 74, 48, 62, 28, 80) },
  // Rizespor
  { name: "Joel Pohjanpalo", position: "ST", nationality: "Finland", nationality_flag: "FI", club: "Rizespor", league: "Super Lig", overall: 73, stats: s(72, 76, 48, 66, 24, 72) },
  { name: "Gokhan Tore", position: "RW", nationality: "Turkey", nationality_flag: "TR", club: "Rizespor", league: "Super Lig", overall: 68, stats: s(74, 66, 62, 72, 28, 58) },
  // Samsunspor
  { name: "Amine Gouiri", position: "CF", nationality: "Algeria", nationality_flag: "DZ", club: "Samsunspor", league: "Super Lig", overall: 76, stats: s(76, 76, 70, 78, 30, 62) },
  { name: "Caner Erkin", position: "LB", nationality: "Turkey", nationality_flag: "TR", club: "Samsunspor", league: "Super Lig", overall: 68, stats: s(68, 52, 66, 64, 66, 66) },
  // Ankaragugu
  { name: "Halil Akbunar", position: "RM", nationality: "Turkey", nationality_flag: "TR", club: "Ankaragugu", league: "Super Lig", overall: 72, stats: s(76, 68, 68, 76, 32, 60) },
  // Additional Turkish League fillers for position coverage
  { name: "Altay Bayindir", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 77, stats: s(40, 14, 34, 18, 16, 68) },
  { name: "Ersin Destanoglu", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Besiktas", league: "Super Lig", overall: 76, stats: s(42, 12, 36, 20, 14, 66) },
  { name: "Samet Akaydin", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 75, stats: s(60, 34, 46, 44, 76, 78) },
  { name: "Merih Demiral", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Al-Ahli", league: "Super Lig", overall: 80, stats: s(66, 38, 48, 46, 82, 82) },
  { name: "Ridvan Yilmaz", position: "LB", nationality: "Turkey", nationality_flag: "TR", club: "Besiktas", league: "Super Lig", overall: 74, stats: s(78, 48, 66, 72, 68, 68) },
  { name: "Zeki Celik", position: "RB", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 77, stats: s(80, 50, 64, 70, 74, 72) },
  { name: "Orkun Kokcu", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Benfica", league: "Super Lig", overall: 80, stats: s(62, 72, 80, 80, 62, 68) },
  { name: "Hakan Calhanoglu", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Inter Milan", league: "Super Lig", overall: 85, stats: s(62, 82, 84, 82, 66, 72) },
  { name: "Arda Guler", position: "CAM", nationality: "Turkey", nationality_flag: "TR", club: "Real Madrid", league: "Super Lig", overall: 80, stats: s(68, 74, 78, 82, 30, 52) },
  { name: "Cengiz Under", position: "RW", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 76, stats: s(82, 72, 66, 80, 26, 56) },
  { name: "Yusuf Yazici", position: "CAM", nationality: "Turkey", nationality_flag: "TR", club: "Trabzonspor", league: "Super Lig", overall: 77, stats: s(62, 76, 76, 78, 34, 60) },
  { name: "Okay Yokuslu", position: "CDM", nationality: "Turkey", nationality_flag: "TR", club: "West Brom", league: "Super Lig", overall: 74, stats: s(54, 52, 66, 64, 76, 78) },
  { name: "Taylan Antalyali", position: "CDM", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 75, stats: s(60, 48, 70, 68, 76, 76) },
  { name: "Enes Unal", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Bournemouth", league: "Super Lig", overall: 76, stats: s(72, 78, 52, 70, 26, 74) },
  { name: "Burak Yilmaz", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Eyupspor", league: "Super Lig", overall: 72, stats: s(62, 78, 56, 68, 26, 72) },
  { name: "Muhammed Sengezer", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Sivasspor", league: "Super Lig", overall: 66, stats: s(38, 10, 30, 16, 12, 62) },
  { name: "Ozan Tufan", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Trabzonspor", league: "Super Lig", overall: 74, stats: s(66, 66, 70, 72, 66, 74) },
  { name: "Ertugrul Cetin", position: "GK", nationality: "Turkey", nationality_flag: "TR", club: "Konyaspor", league: "Super Lig", overall: 64, stats: s(36, 10, 28, 14, 12, 60) },
  { name: "Dogukan Sinik", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Antalyaspor", league: "Super Lig", overall: 72, stats: s(82, 64, 60, 74, 28, 58) },
  { name: "Omer Toprak", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Antalyaspor", league: "Super Lig", overall: 74, stats: s(48, 36, 56, 50, 78, 72) },
  { name: "Ahmetcan Kaplan", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Ajax", league: "Super Lig", overall: 72, stats: s(62, 28, 48, 48, 74, 76) },
  { name: "Emirhan Ilkhan", position: "CM", nationality: "Turkey", nationality_flag: "TR", club: "Trabzonspor", league: "Super Lig", overall: 68, stats: s(64, 56, 66, 68, 58, 62) },
  { name: "Cenk Ozkacar", position: "CB", nationality: "Turkey", nationality_flag: "TR", club: "Valencia", league: "Super Lig", overall: 72, stats: s(64, 30, 44, 44, 74, 78) },
  { name: "Yunus Akgun", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 73, stats: s(82, 68, 64, 76, 24, 56) },
  { name: "Baris Alper Yilmaz", position: "RW", nationality: "Turkey", nationality_flag: "TR", club: "Galatasaray", league: "Super Lig", overall: 76, stats: s(88, 68, 64, 78, 28, 60) },
  { name: "Salih Ozcan", position: "CDM", nationality: "Turkey", nationality_flag: "TR", club: "Dortmund", league: "Super Lig", overall: 74, stats: s(62, 54, 68, 68, 76, 76) },
  { name: "Omer Faruk Beyaz", position: "CAM", nationality: "Turkey", nationality_flag: "TR", club: "Fenerbahce", league: "Super Lig", overall: 70, stats: s(66, 66, 70, 74, 28, 50) },
  { name: "Semih Kilicsoy", position: "ST", nationality: "Turkey", nationality_flag: "TR", club: "Besiktas", league: "Super Lig", overall: 72, stats: s(78, 72, 52, 72, 22, 62) },
];

// ============================================================
// PREMIER LEAGUE (England) - 105 players
// ============================================================
const premierLeague = [
  // Manchester City
  { name: "Erling Haaland", position: "ST", nationality: "Norway", nationality_flag: "NO", club: "Manchester City", league: "Premier League", overall: 91, stats: s(89, 93, 66, 80, 44, 88) },
  { name: "Kevin De Bruyne", position: "CAM", nationality: "Belgium", nationality_flag: "BE", club: "Manchester City", league: "Premier League", overall: 91, stats: s(72, 86, 93, 88, 58, 72) },
  { name: "Rodri", position: "CDM", nationality: "Spain", nationality_flag: "ES", club: "Manchester City", league: "Premier League", overall: 89, stats: s(58, 72, 84, 80, 86, 80) },
  { name: "Bernardo Silva", position: "CM", nationality: "Portugal", nationality_flag: "PT", club: "Manchester City", league: "Premier League", overall: 87, stats: s(72, 76, 86, 90, 60, 66) },
  { name: "Phil Foden", position: "LW", nationality: "England", nationality_flag: "GB", club: "Manchester City", league: "Premier League", overall: 87, stats: s(80, 82, 84, 90, 40, 62) },
  { name: "Ederson", position: "GK", nationality: "Brazil", nationality_flag: "BR", club: "Manchester City", league: "Premier League", overall: 87, stats: s(48, 18, 66, 24, 20, 74) },
  { name: "Ruben Dias", position: "CB", nationality: "Portugal", nationality_flag: "PT", club: "Manchester City", league: "Premier League", overall: 87, stats: s(62, 42, 62, 58, 88, 80) },
  { name: "Jack Grealish", position: "LW", nationality: "England", nationality_flag: "GB", club: "Manchester City", league: "Premier League", overall: 83, stats: s(76, 72, 80, 86, 38, 66) },
  { name: "Kyle Walker", position: "RB", nationality: "England", nationality_flag: "GB", club: "Manchester City", league: "Premier League", overall: 82, stats: s(90, 46, 64, 72, 78, 82) },
  { name: "John Stones", position: "CB", nationality: "England", nationality_flag: "GB", club: "Manchester City", league: "Premier League", overall: 84, stats: s(58, 42, 68, 64, 84, 74) },
  { name: "Julian Alvarez", position: "ST", nationality: "Argentina", nationality_flag: "AR", club: "Manchester City", league: "Premier League", overall: 84, stats: s(80, 82, 76, 84, 48, 72) },
  // Arsenal
  { name: "Bukayo Saka", position: "RW", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 87, stats: s(84, 80, 82, 88, 56, 66) },
  { name: "Martin Odegaard", position: "CAM", nationality: "Norway", nationality_flag: "NO", club: "Arsenal", league: "Premier League", overall: 88, stats: s(68, 78, 88, 90, 54, 60) },
  { name: "William Saliba", position: "CB", nationality: "France", nationality_flag: "FR", club: "Arsenal", league: "Premier League", overall: 86, stats: s(72, 36, 58, 58, 86, 82) },
  { name: "Declan Rice", position: "CDM", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 86, stats: s(68, 70, 78, 76, 86, 80) },
  { name: "Gabriel Jesus", position: "ST", nationality: "Brazil", nationality_flag: "BR", club: "Arsenal", league: "Premier League", overall: 82, stats: s(82, 78, 72, 84, 42, 68) },
  { name: "Gabriel Magalhaes", position: "CB", nationality: "Brazil", nationality_flag: "BR", club: "Arsenal", league: "Premier League", overall: 84, stats: s(60, 50, 48, 50, 84, 84) },
  { name: "Aaron Ramsdale", position: "GK", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 80, stats: s(42, 14, 42, 18, 16, 66) },
  { name: "Ben White", position: "RB", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 82, stats: s(72, 40, 66, 70, 80, 72) },
  { name: "Kai Havertz", position: "CF", nationality: "Germany", nationality_flag: "DE", club: "Arsenal", league: "Premier League", overall: 82, stats: s(72, 78, 74, 80, 44, 72) },
  // Liverpool
  { name: "Mohamed Salah", position: "RW", nationality: "Egypt", nationality_flag: "EG", club: "Liverpool", league: "Premier League", overall: 89, stats: s(90, 88, 80, 90, 38, 72) },
  { name: "Virgil van Dijk", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Liverpool", league: "Premier League", overall: 88, stats: s(64, 44, 62, 58, 90, 86) },
  { name: "Alisson", position: "GK", nationality: "Brazil", nationality_flag: "BR", club: "Liverpool", league: "Premier League", overall: 89, stats: s(46, 16, 56, 22, 20, 76) },
  { name: "Trent Alexander-Arnold", position: "RB", nationality: "England", nationality_flag: "GB", club: "Liverpool", league: "Premier League", overall: 84, stats: s(72, 68, 88, 78, 72, 66) },
  { name: "Luis Diaz", position: "LW", nationality: "Colombia", nationality_flag: "CO", club: "Liverpool", league: "Premier League", overall: 83, stats: s(90, 76, 72, 86, 34, 68) },
  { name: "Darwin Nunez", position: "ST", nationality: "Uruguay", nationality_flag: "UY", club: "Liverpool", league: "Premier League", overall: 82, stats: s(90, 82, 60, 76, 36, 78) },
  { name: "Diogo Jota", position: "LW", nationality: "Portugal", nationality_flag: "PT", club: "Liverpool", league: "Premier League", overall: 83, stats: s(82, 80, 72, 84, 38, 72) },
  { name: "Andrew Robertson", position: "LB", nationality: "Scotland", nationality_flag: "GB", club: "Liverpool", league: "Premier League", overall: 83, stats: s(80, 52, 80, 76, 78, 74) },
  { name: "Alexis Mac Allister", position: "CM", nationality: "Argentina", nationality_flag: "AR", club: "Liverpool", league: "Premier League", overall: 83, stats: s(64, 72, 82, 82, 68, 66) },
  // Manchester United
  { name: "Bruno Fernandes", position: "CAM", nationality: "Portugal", nationality_flag: "PT", club: "Manchester United", league: "Premier League", overall: 86, stats: s(66, 84, 86, 84, 56, 68) },
  { name: "Marcus Rashford", position: "LW", nationality: "England", nationality_flag: "GB", club: "Manchester United", league: "Premier League", overall: 82, stats: s(92, 80, 72, 84, 36, 72) },
  { name: "Casemiro", position: "CDM", nationality: "Brazil", nationality_flag: "BR", club: "Manchester United", league: "Premier League", overall: 84, stats: s(52, 66, 72, 70, 86, 82) },
  { name: "Lisandro Martinez", position: "CB", nationality: "Argentina", nationality_flag: "AR", club: "Manchester United", league: "Premier League", overall: 82, stats: s(60, 38, 64, 60, 82, 80) },
  { name: "Andre Onana", position: "GK", nationality: "Cameroon", nationality_flag: "CM", club: "Manchester United", league: "Premier League", overall: 82, stats: s(44, 14, 52, 20, 18, 70) },
  { name: "Rasmus Hojlund", position: "ST", nationality: "Denmark", nationality_flag: "DK", club: "Manchester United", league: "Premier League", overall: 78, stats: s(84, 78, 56, 74, 30, 76) },
  { name: "Kobbie Mainoo", position: "CM", nationality: "England", nationality_flag: "GB", club: "Manchester United", league: "Premier League", overall: 76, stats: s(68, 64, 72, 76, 70, 68) },
  // Chelsea
  { name: "Cole Palmer", position: "RW", nationality: "England", nationality_flag: "GB", club: "Chelsea", league: "Premier League", overall: 85, stats: s(76, 84, 82, 88, 36, 58) },
  { name: "Enzo Fernandez", position: "CM", nationality: "Argentina", nationality_flag: "AR", club: "Chelsea", league: "Premier League", overall: 84, stats: s(64, 72, 82, 80, 76, 70) },
  { name: "Reece James", position: "RB", nationality: "England", nationality_flag: "GB", club: "Chelsea", league: "Premier League", overall: 82, stats: s(76, 62, 76, 76, 80, 78) },
  { name: "Nicolas Jackson", position: "ST", nationality: "Senegal", nationality_flag: "SN", club: "Chelsea", league: "Premier League", overall: 79, stats: s(86, 76, 60, 78, 30, 70) },
  { name: "Moises Caicedo", position: "CDM", nationality: "Ecuador", nationality_flag: "EC", club: "Chelsea", league: "Premier League", overall: 81, stats: s(72, 60, 72, 72, 80, 78) },
  { name: "Robert Sanchez", position: "GK", nationality: "Spain", nationality_flag: "ES", club: "Chelsea", league: "Premier League", overall: 79, stats: s(40, 12, 40, 16, 14, 68) },
  // Tottenham
  { name: "Son Heung-min", position: "LW", nationality: "South Korea", nationality_flag: "KR", club: "Tottenham", league: "Premier League", overall: 87, stats: s(86, 86, 80, 86, 38, 66) },
  { name: "James Maddison", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Tottenham", league: "Premier League", overall: 82, stats: s(60, 76, 84, 84, 48, 60) },
  { name: "Cristian Romero", position: "CB", nationality: "Argentina", nationality_flag: "AR", club: "Tottenham", league: "Premier League", overall: 84, stats: s(70, 38, 52, 54, 86, 82) },
  { name: "Richarlison", position: "ST", nationality: "Brazil", nationality_flag: "BR", club: "Tottenham", league: "Premier League", overall: 80, stats: s(80, 78, 62, 78, 38, 76) },
  { name: "Guglielmo Vicario", position: "GK", nationality: "Italy", nationality_flag: "IT", club: "Tottenham", league: "Premier League", overall: 82, stats: s(42, 14, 38, 18, 16, 72) },
  // Newcastle
  { name: "Alexander Isak", position: "ST", nationality: "Sweden", nationality_flag: "SE", club: "Newcastle", league: "Premier League", overall: 85, stats: s(86, 84, 70, 84, 30, 70) },
  { name: "Bruno Guimaraes", position: "CM", nationality: "Brazil", nationality_flag: "BR", club: "Newcastle", league: "Premier League", overall: 85, stats: s(62, 70, 82, 84, 78, 74) },
  { name: "Sandro Tonali", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "Newcastle", league: "Premier League", overall: 81, stats: s(64, 66, 76, 78, 78, 76) },
  { name: "Kieran Trippier", position: "RB", nationality: "England", nationality_flag: "GB", club: "Newcastle", league: "Premier League", overall: 81, stats: s(68, 60, 80, 74, 76, 72) },
  { name: "Nick Pope", position: "GK", nationality: "England", nationality_flag: "GB", club: "Newcastle", league: "Premier League", overall: 82, stats: s(40, 14, 36, 16, 16, 74) },
  // Aston Villa
  { name: "Ollie Watkins", position: "ST", nationality: "England", nationality_flag: "GB", club: "Aston Villa", league: "Premier League", overall: 83, stats: s(84, 80, 68, 80, 36, 74) },
  { name: "Emiliano Martinez", position: "GK", nationality: "Argentina", nationality_flag: "AR", club: "Aston Villa", league: "Premier League", overall: 87, stats: s(44, 16, 44, 20, 18, 76) },
  { name: "Douglas Luiz", position: "CM", nationality: "Brazil", nationality_flag: "BR", club: "Aston Villa", league: "Premier League", overall: 82, stats: s(58, 72, 78, 80, 74, 70) },
  { name: "Moussa Diaby", position: "RW", nationality: "France", nationality_flag: "FR", club: "Aston Villa", league: "Premier League", overall: 82, stats: s(92, 76, 72, 84, 32, 58) },
  { name: "Tyrone Mings", position: "CB", nationality: "England", nationality_flag: "GB", club: "Aston Villa", league: "Premier League", overall: 78, stats: s(62, 30, 52, 48, 78, 80) },
  // West Ham
  { name: "Jarrod Bowen", position: "RW", nationality: "England", nationality_flag: "GB", club: "West Ham", league: "Premier League", overall: 82, stats: s(82, 78, 74, 82, 40, 66) },
  { name: "Mohammed Kudus", position: "CAM", nationality: "Ghana", nationality_flag: "GH", club: "West Ham", league: "Premier League", overall: 81, stats: s(82, 76, 72, 84, 42, 70) },
  { name: "Lucas Paqueta", position: "CAM", nationality: "Brazil", nationality_flag: "BR", club: "West Ham", league: "Premier League", overall: 83, stats: s(68, 74, 80, 86, 52, 68) },
  // Brighton
  { name: "Kaoru Mitoma", position: "LW", nationality: "Japan", nationality_flag: "JP", club: "Brighton", league: "Premier League", overall: 80, stats: s(86, 72, 72, 84, 30, 56) },
  { name: "Evan Ferguson", position: "ST", nationality: "Ireland", nationality_flag: "IE", club: "Brighton", league: "Premier League", overall: 77, stats: s(72, 78, 52, 72, 26, 74) },
  { name: "Joao Pedro", position: "CF", nationality: "Brazil", nationality_flag: "BR", club: "Brighton", league: "Premier League", overall: 78, stats: s(74, 74, 68, 80, 30, 62) },
  // Crystal Palace
  { name: "Eberechi Eze", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Crystal Palace", league: "Premier League", overall: 81, stats: s(76, 76, 78, 86, 36, 60) },
  { name: "Michael Olise", position: "RW", nationality: "France", nationality_flag: "FR", club: "Crystal Palace", league: "Premier League", overall: 80, stats: s(78, 74, 76, 86, 28, 56) },
  { name: "Marc Guehi", position: "CB", nationality: "England", nationality_flag: "GB", club: "Crystal Palace", league: "Premier League", overall: 80, stats: s(62, 34, 56, 56, 82, 76) },
  // Wolves
  { name: "Matheus Cunha", position: "CF", nationality: "Brazil", nationality_flag: "BR", club: "Wolves", league: "Premier League", overall: 80, stats: s(80, 76, 74, 84, 32, 68) },
  { name: "Pedro Neto", position: "LW", nationality: "Portugal", nationality_flag: "PT", club: "Wolves", league: "Premier League", overall: 80, stats: s(90, 72, 74, 86, 30, 56) },
  { name: "Jose Sa", position: "GK", nationality: "Portugal", nationality_flag: "PT", club: "Wolves", league: "Premier League", overall: 80, stats: s(40, 12, 40, 16, 14, 70) },
  // Fulham
  { name: "Joao Palhinha", position: "CDM", nationality: "Portugal", nationality_flag: "PT", club: "Fulham", league: "Premier League", overall: 83, stats: s(56, 58, 66, 66, 84, 82) },
  { name: "Bernd Leno", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Fulham", league: "Premier League", overall: 80, stats: s(38, 14, 38, 16, 14, 68) },
  { name: "Andreas Pereira", position: "CAM", nationality: "Brazil", nationality_flag: "BR", club: "Fulham", league: "Premier League", overall: 78, stats: s(68, 72, 76, 80, 42, 60) },
  // Everton
  { name: "Abdoulaye Doucoure", position: "CM", nationality: "France", nationality_flag: "FR", club: "Everton", league: "Premier League", overall: 77, stats: s(68, 66, 68, 72, 72, 78) },
  { name: "Dominic Calvert-Lewin", position: "ST", nationality: "England", nationality_flag: "GB", club: "Everton", league: "Premier League", overall: 76, stats: s(76, 76, 50, 68, 38, 78) },
  { name: "Jordan Pickford", position: "GK", nationality: "England", nationality_flag: "GB", club: "Everton", league: "Premier League", overall: 81, stats: s(42, 14, 42, 18, 16, 68) },
  // Brentford
  { name: "Ivan Toney", position: "ST", nationality: "England", nationality_flag: "GB", club: "Brentford", league: "Premier League", overall: 80, stats: s(68, 80, 64, 76, 36, 80) },
  { name: "Bryan Mbeumo", position: "RW", nationality: "Cameroon", nationality_flag: "CM", club: "Brentford", league: "Premier League", overall: 79, stats: s(84, 76, 68, 80, 32, 60) },
  { name: "David Raya", position: "GK", nationality: "Spain", nationality_flag: "ES", club: "Arsenal", league: "Premier League", overall: 84, stats: s(44, 14, 46, 18, 16, 68) },
  // Bournemouth
  { name: "Dominik Solanke", position: "ST", nationality: "England", nationality_flag: "GB", club: "Bournemouth", league: "Premier League", overall: 78, stats: s(72, 76, 60, 74, 34, 74) },
  { name: "Marcus Tavernier", position: "LM", nationality: "England", nationality_flag: "GB", club: "Bournemouth", league: "Premier League", overall: 76, stats: s(76, 66, 70, 78, 56, 68) },
  // Nottingham Forest
  { name: "Morgan Gibbs-White", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Nottingham Forest", league: "Premier League", overall: 79, stats: s(72, 70, 76, 82, 44, 66) },
  { name: "Callum Hudson-Odoi", position: "RW", nationality: "England", nationality_flag: "GB", club: "Nottingham Forest", league: "Premier League", overall: 76, stats: s(82, 68, 68, 82, 28, 54) },
  { name: "Taiwo Awoniyi", position: "ST", nationality: "Nigeria", nationality_flag: "NG", club: "Nottingham Forest", league: "Premier League", overall: 75, stats: s(76, 74, 46, 68, 30, 78) },
  // Burnley
  { name: "Sander Berge", position: "CM", nationality: "Norway", nationality_flag: "NO", club: "Burnley", league: "Premier League", overall: 76, stats: s(64, 62, 70, 72, 74, 78) },
  { name: "Anass Zaroury", position: "LW", nationality: "Morocco", nationality_flag: "MA", club: "Burnley", league: "Premier League", overall: 73, stats: s(82, 66, 64, 78, 26, 58) },
  // Luton Town
  { name: "Carlton Morris", position: "ST", nationality: "England", nationality_flag: "GB", club: "Luton Town", league: "Premier League", overall: 72, stats: s(70, 72, 46, 64, 30, 76) },
  { name: "Ross Barkley", position: "CM", nationality: "England", nationality_flag: "GB", club: "Luton Town", league: "Premier League", overall: 74, stats: s(66, 70, 72, 76, 52, 70) },
  // Sheffield United
  { name: "Gustavo Hamer", position: "CM", nationality: "Netherlands", nationality_flag: "NL", club: "Sheffield United", league: "Premier League", overall: 75, stats: s(62, 68, 72, 76, 66, 70) },
  { name: "Oliver McBurnie", position: "ST", nationality: "Scotland", nationality_flag: "GB", club: "Sheffield United", league: "Premier League", overall: 72, stats: s(64, 72, 48, 62, 32, 78) },
  // Misc PL depth
  { name: "Leandro Trossard", position: "LW", nationality: "Belgium", nationality_flag: "BE", club: "Arsenal", league: "Premier League", overall: 81, stats: s(76, 78, 74, 82, 38, 62) },
  { name: "Dominik Szoboszlai", position: "CM", nationality: "Hungary", nationality_flag: "HU", club: "Liverpool", league: "Premier League", overall: 81, stats: s(72, 72, 78, 80, 60, 72) },
  { name: "Ibrahima Konate", position: "CB", nationality: "France", nationality_flag: "FR", club: "Liverpool", league: "Premier League", overall: 83, stats: s(72, 34, 48, 50, 84, 82) },
  { name: "Mateo Kovacic", position: "CM", nationality: "Croatia", nationality_flag: "HR", club: "Manchester City", league: "Premier League", overall: 83, stats: s(64, 66, 82, 84, 72, 70) },
  { name: "Nathan Ake", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Manchester City", league: "Premier League", overall: 82, stats: s(62, 36, 58, 58, 82, 78) },
  { name: "Diogo Dalot", position: "RB", nationality: "Portugal", nationality_flag: "PT", club: "Manchester United", league: "Premier League", overall: 80, stats: s(78, 56, 72, 76, 76, 72) },
  { name: "Pervis Estupinan", position: "LB", nationality: "Ecuador", nationality_flag: "EC", club: "Brighton", league: "Premier League", overall: 80, stats: s(82, 56, 72, 74, 74, 74) },
  { name: "Lewis Dunk", position: "CB", nationality: "England", nationality_flag: "GB", club: "Brighton", league: "Premier League", overall: 79, stats: s(48, 40, 58, 48, 80, 78) },
  { name: "Micky van de Ven", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Tottenham", league: "Premier League", overall: 81, stats: s(86, 36, 52, 56, 82, 78) },
  { name: "Destiny Udogie", position: "LB", nationality: "Italy", nationality_flag: "IT", club: "Tottenham", league: "Premier League", overall: 79, stats: s(84, 52, 66, 76, 72, 74) },
  { name: "Amadou Onana", position: "CDM", nationality: "Belgium", nationality_flag: "BE", club: "Everton", league: "Premier League", overall: 78, stats: s(68, 58, 66, 70, 76, 82) },
  { name: "Harvey Elliott", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Liverpool", league: "Premier League", overall: 77, stats: s(66, 66, 74, 80, 40, 54) },
  { name: "Cody Gakpo", position: "LW", nationality: "Netherlands", nationality_flag: "NL", club: "Liverpool", league: "Premier League", overall: 80, stats: s(82, 76, 72, 82, 34, 68) },
  { name: "Emile Smith Rowe", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 76, stats: s(70, 68, 74, 80, 38, 54) },
  { name: "Eddie Nketiah", position: "ST", nationality: "England", nationality_flag: "GB", club: "Arsenal", league: "Premier League", overall: 76, stats: s(78, 74, 54, 74, 28, 66) },
];

// ============================================================
// LA LIGA (Spain) - 85 players
// ============================================================
const laLiga = [
  // Real Madrid
  { name: "Jude Bellingham", position: "CAM", nationality: "England", nationality_flag: "GB", club: "Real Madrid", league: "La Liga", overall: 89, stats: s(76, 84, 82, 86, 68, 78) },
  { name: "Vinicius Jr", position: "LW", nationality: "Brazil", nationality_flag: "BR", club: "Real Madrid", league: "La Liga", overall: 92, stats: s(95, 86, 78, 94, 28, 68) },
  { name: "Toni Kroos", position: "CM", nationality: "Germany", nationality_flag: "DE", club: "Real Madrid", league: "La Liga", overall: 88, stats: s(46, 78, 92, 82, 72, 66) },
  { name: "Luka Modric", position: "CM", nationality: "Croatia", nationality_flag: "HR", club: "Real Madrid", league: "La Liga", overall: 86, stats: s(60, 74, 88, 88, 66, 60) },
  { name: "Thibaut Courtois", position: "GK", nationality: "Belgium", nationality_flag: "BE", club: "Real Madrid", league: "La Liga", overall: 89, stats: s(44, 16, 42, 20, 20, 78) },
  { name: "Antonio Rudiger", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Real Madrid", league: "La Liga", overall: 85, stats: s(74, 44, 54, 56, 86, 84) },
  { name: "Federico Valverde", position: "CM", nationality: "Uruguay", nationality_flag: "UY", club: "Real Madrid", league: "La Liga", overall: 87, stats: s(82, 78, 80, 82, 76, 80) },
  { name: "Eduardo Camavinga", position: "CM", nationality: "France", nationality_flag: "FR", club: "Real Madrid", league: "La Liga", overall: 83, stats: s(74, 64, 76, 80, 78, 76) },
  { name: "Dani Carvajal", position: "RB", nationality: "Spain", nationality_flag: "ES", club: "Real Madrid", league: "La Liga", overall: 85, stats: s(74, 56, 74, 76, 82, 76) },
  { name: "Aurelien Tchouameni", position: "CDM", nationality: "France", nationality_flag: "FR", club: "Real Madrid", league: "La Liga", overall: 84, stats: s(68, 64, 74, 74, 84, 80) },
  { name: "Rodrygo", position: "RW", nationality: "Brazil", nationality_flag: "BR", club: "Real Madrid", league: "La Liga", overall: 84, stats: s(86, 78, 76, 86, 32, 62) },
  { name: "Eder Militao", position: "CB", nationality: "Brazil", nationality_flag: "BR", club: "Real Madrid", league: "La Liga", overall: 84, stats: s(72, 38, 52, 56, 84, 82) },
  // Barcelona
  { name: "Robert Lewandowski", position: "ST", nationality: "Poland", nationality_flag: "PL", club: "Barcelona", league: "La Liga", overall: 88, stats: s(62, 92, 78, 84, 38, 76) },
  { name: "Pedri", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 86, stats: s(68, 70, 86, 90, 62, 60) },
  { name: "Gavi", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 82, stats: s(72, 66, 78, 82, 72, 72) },
  { name: "Frenkie de Jong", position: "CM", nationality: "Netherlands", nationality_flag: "NL", club: "Barcelona", league: "La Liga", overall: 85, stats: s(72, 66, 84, 88, 72, 66) },
  { name: "Marc-Andre ter Stegen", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Barcelona", league: "La Liga", overall: 88, stats: s(44, 16, 62, 22, 18, 72) },
  { name: "Ronald Araujo", position: "CB", nationality: "Uruguay", nationality_flag: "UY", club: "Barcelona", league: "La Liga", overall: 85, stats: s(76, 40, 46, 52, 86, 84) },
  { name: "Raphinha", position: "RW", nationality: "Brazil", nationality_flag: "BR", club: "Barcelona", league: "La Liga", overall: 83, stats: s(84, 76, 76, 84, 34, 62) },
  { name: "Jules Kounde", position: "CB", nationality: "France", nationality_flag: "FR", club: "Barcelona", league: "La Liga", overall: 84, stats: s(76, 40, 62, 64, 84, 74) },
  { name: "Joao Felix", position: "CF", nationality: "Portugal", nationality_flag: "PT", club: "Barcelona", league: "La Liga", overall: 81, stats: s(76, 76, 74, 84, 32, 60) },
  { name: "Joao Cancelo", position: "RB", nationality: "Portugal", nationality_flag: "PT", club: "Barcelona", league: "La Liga", overall: 84, stats: s(78, 64, 78, 82, 76, 72) },
  { name: "Lamine Yamal", position: "RW", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 81, stats: s(86, 70, 74, 86, 24, 48) },
  { name: "Fermin Lopez", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 78, stats: s(72, 72, 72, 78, 56, 66) },
  // Atletico Madrid
  { name: "Antoine Griezmann", position: "CF", nationality: "France", nationality_flag: "FR", club: "Atletico Madrid", league: "La Liga", overall: 85, stats: s(72, 82, 82, 84, 56, 66) },
  { name: "Jan Oblak", position: "GK", nationality: "Slovenia", nationality_flag: "SI", club: "Atletico Madrid", league: "La Liga", overall: 88, stats: s(42, 14, 40, 18, 18, 74) },
  { name: "Alvaro Morata", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Atletico Madrid", league: "La Liga", overall: 82, stats: s(76, 80, 64, 76, 36, 72) },
  { name: "Memphis Depay", position: "CF", nationality: "Netherlands", nationality_flag: "NL", club: "Atletico Madrid", league: "La Liga", overall: 80, stats: s(78, 80, 74, 84, 28, 66) },
  { name: "Jose Gimenez", position: "CB", nationality: "Uruguay", nationality_flag: "UY", club: "Atletico Madrid", league: "La Liga", overall: 82, stats: s(60, 38, 48, 48, 84, 82) },
  { name: "Koke", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Atletico Madrid", league: "La Liga", overall: 82, stats: s(58, 66, 82, 82, 72, 68) },
  { name: "Marcos Llorente", position: "RM", nationality: "Spain", nationality_flag: "ES", club: "Atletico Madrid", league: "La Liga", overall: 82, stats: s(84, 72, 72, 78, 72, 78) },
  { name: "Nahuel Molina", position: "RB", nationality: "Argentina", nationality_flag: "AR", club: "Atletico Madrid", league: "La Liga", overall: 81, stats: s(80, 60, 68, 74, 76, 74) },
  // Real Sociedad
  { name: "Mikel Oyarzabal", position: "LW", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 82, stats: s(74, 78, 78, 82, 40, 64) },
  { name: "Martin Zubimendi", position: "CDM", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 83, stats: s(58, 64, 80, 78, 82, 74) },
  { name: "Take Kubo", position: "RW", nationality: "Japan", nationality_flag: "JP", club: "Real Sociedad", league: "La Liga", overall: 81, stats: s(78, 72, 76, 86, 28, 54) },
  { name: "Brais Mendez", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 80, stats: s(66, 74, 78, 82, 42, 64) },
  // Villarreal
  { name: "Gerard Moreno", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Villarreal", league: "La Liga", overall: 82, stats: s(70, 82, 72, 80, 36, 68) },
  { name: "Alexander Sorloth", position: "ST", nationality: "Norway", nationality_flag: "NO", club: "Villarreal", league: "La Liga", overall: 80, stats: s(78, 80, 54, 72, 30, 82) },
  { name: "Giovani Lo Celso", position: "CAM", nationality: "Argentina", nationality_flag: "AR", club: "Villarreal", league: "La Liga", overall: 79, stats: s(62, 70, 78, 82, 54, 58) },
  // Real Betis
  { name: "Isco", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Real Betis", league: "La Liga", overall: 80, stats: s(56, 72, 82, 86, 38, 56) },
  { name: "Nabil Fekir", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Real Betis", league: "La Liga", overall: 81, stats: s(64, 76, 80, 86, 38, 64) },
  { name: "Ayoze Perez", position: "CF", nationality: "Spain", nationality_flag: "ES", club: "Real Betis", league: "La Liga", overall: 78, stats: s(72, 74, 68, 78, 40, 66) },
  // Sevilla
  { name: "Youssef En-Nesyri", position: "ST", nationality: "Morocco", nationality_flag: "MA", club: "Sevilla", league: "La Liga", overall: 79, stats: s(80, 78, 52, 72, 30, 78) },
  { name: "Ivan Rakitic", position: "CM", nationality: "Croatia", nationality_flag: "HR", club: "Sevilla", league: "La Liga", overall: 79, stats: s(50, 72, 80, 76, 62, 62) },
  { name: "Loic Bade", position: "CB", nationality: "France", nationality_flag: "FR", club: "Sevilla", league: "La Liga", overall: 78, stats: s(68, 32, 48, 50, 80, 78) },
  // Athletic Bilbao
  { name: "Nico Williams", position: "LW", nationality: "Spain", nationality_flag: "ES", club: "Athletic Bilbao", league: "La Liga", overall: 83, stats: s(92, 74, 72, 86, 30, 64) },
  { name: "Inaki Williams", position: "RW", nationality: "Spain", nationality_flag: "ES", club: "Athletic Bilbao", league: "La Liga", overall: 81, stats: s(92, 76, 60, 80, 38, 80) },
  { name: "Unai Simon", position: "GK", nationality: "Spain", nationality_flag: "ES", club: "Athletic Bilbao", league: "La Liga", overall: 84, stats: s(44, 14, 46, 20, 16, 72) },
  { name: "Oihan Sancet", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Athletic Bilbao", league: "La Liga", overall: 80, stats: s(68, 74, 76, 80, 58, 68) },
  // Valencia
  { name: "Edinson Cavani", position: "ST", nationality: "Uruguay", nationality_flag: "UY", club: "Valencia", league: "La Liga", overall: 78, stats: s(66, 82, 58, 72, 40, 76) },
  { name: "Hugo Duro", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Valencia", league: "La Liga", overall: 77, stats: s(74, 76, 54, 72, 34, 76) },
  // Girona
  { name: "Artem Dovbyk", position: "ST", nationality: "Ukraine", nationality_flag: "UA", club: "Girona", league: "La Liga", overall: 80, stats: s(72, 82, 54, 72, 28, 80) },
  { name: "Savio", position: "RW", nationality: "Brazil", nationality_flag: "BR", club: "Girona", league: "La Liga", overall: 78, stats: s(88, 70, 68, 82, 24, 52) },
  { name: "Aleix Garcia", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Girona", league: "La Liga", overall: 79, stats: s(54, 62, 80, 78, 68, 64) },
  // Celta Vigo
  { name: "Iago Aspas", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Celta Vigo", league: "La Liga", overall: 81, stats: s(66, 82, 78, 84, 32, 56) },
  { name: "Gabri Veiga", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Celta Vigo", league: "La Liga", overall: 77, stats: s(66, 72, 74, 78, 56, 66) },
  // Mallorca
  { name: "Vedat Muriqi", position: "ST", nationality: "Kosovo", nationality_flag: "XK", club: "Mallorca", league: "La Liga", overall: 78, stats: s(60, 78, 52, 66, 34, 84) },
  { name: "Predrag Rajkovic", position: "GK", nationality: "Serbia", nationality_flag: "RS", club: "Mallorca", league: "La Liga", overall: 78, stats: s(40, 12, 36, 16, 14, 68) },
  // Osasuna
  { name: "Ante Budimir", position: "ST", nationality: "Croatia", nationality_flag: "HR", club: "Osasuna", league: "La Liga", overall: 78, stats: s(62, 78, 52, 66, 36, 82) },
  { name: "Aimar Oroz", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Osasuna", league: "La Liga", overall: 76, stats: s(62, 70, 76, 78, 40, 58) },
  // Getafe
  { name: "Borja Mayoral", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Getafe", league: "La Liga", overall: 76, stats: s(74, 76, 56, 72, 28, 66) },
  { name: "Mauro Arambarri", position: "CDM", nationality: "Uruguay", nationality_flag: "UY", club: "Getafe", league: "La Liga", overall: 76, stats: s(56, 56, 68, 68, 78, 76) },
  // Rayo Vallecano
  { name: "Radamel Falcao", position: "ST", nationality: "Colombia", nationality_flag: "CO", club: "Rayo Vallecano", league: "La Liga", overall: 74, stats: s(52, 78, 52, 68, 28, 66) },
  { name: "Oscar Trejo", position: "CAM", nationality: "Argentina", nationality_flag: "AR", club: "Rayo Vallecano", league: "La Liga", overall: 76, stats: s(50, 70, 78, 78, 42, 56) },
  // Cadiz
  { name: "Chris Ramos", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Cadiz", league: "La Liga", overall: 72, stats: s(72, 72, 46, 64, 28, 76) },
  { name: "Joselu", position: "ST", nationality: "Spain", nationality_flag: "ES", club: "Real Madrid", league: "La Liga", overall: 78, stats: s(58, 80, 52, 66, 32, 78) },
  // Almeria
  { name: "Luis Suarez", position: "ST", nationality: "Colombia", nationality_flag: "CO", club: "Almeria", league: "La Liga", overall: 73, stats: s(80, 72, 52, 72, 24, 70) },
  // Las Palmas
  { name: "Jonathan Viera", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Las Palmas", league: "La Liga", overall: 76, stats: s(56, 70, 78, 80, 36, 54) },
  { name: "Alberto Moleiro", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Las Palmas", league: "La Liga", overall: 74, stats: s(66, 66, 72, 78, 32, 52) },
  // Additional La Liga
  { name: "Alex Remiro", position: "GK", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 83, stats: s(42, 14, 42, 18, 16, 70) },
  { name: "Pau Cubarsi", position: "CB", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 77, stats: s(68, 30, 54, 56, 78, 74) },
  { name: "Reinildo", position: "LB", nationality: "Mozambique", nationality_flag: "MZ", club: "Atletico Madrid", league: "La Liga", overall: 78, stats: s(76, 36, 56, 62, 78, 78) },
  { name: "Alejandro Balde", position: "LB", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 79, stats: s(88, 48, 68, 78, 70, 68) },
  { name: "Dani Vivian", position: "CB", nationality: "Spain", nationality_flag: "ES", club: "Athletic Bilbao", league: "La Liga", overall: 79, stats: s(58, 32, 48, 46, 80, 80) },
  { name: "Robin Le Normand", position: "CB", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 81, stats: s(58, 34, 50, 48, 82, 80) },
  { name: "David Alaba", position: "CB", nationality: "Austria", nationality_flag: "AT", club: "Real Madrid", league: "La Liga", overall: 83, stats: s(68, 52, 72, 72, 82, 72) },
  { name: "Ferland Mendy", position: "LB", nationality: "France", nationality_flag: "FR", club: "Real Madrid", league: "La Liga", overall: 82, stats: s(84, 48, 62, 72, 80, 80) },
  { name: "Ilkay Gundogan", position: "CM", nationality: "Germany", nationality_flag: "DE", club: "Barcelona", league: "La Liga", overall: 84, stats: s(58, 76, 82, 82, 62, 66) },
  { name: "Yannick Carrasco", position: "LM", nationality: "Belgium", nationality_flag: "BE", club: "Atletico Madrid", league: "La Liga", overall: 80, stats: s(84, 72, 72, 84, 44, 62) },
  { name: "Samuel Lino", position: "LW", nationality: "Brazil", nationality_flag: "BR", club: "Atletico Madrid", league: "La Liga", overall: 76, stats: s(86, 68, 58, 78, 32, 66) },
  { name: "Mikel Merino", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "Real Sociedad", league: "La Liga", overall: 80, stats: s(60, 68, 76, 76, 76, 80) },
  { name: "Sergi Roberto", position: "RB", nationality: "Spain", nationality_flag: "ES", club: "Barcelona", league: "La Liga", overall: 76, stats: s(68, 54, 72, 74, 72, 68) },
  { name: "Geronimo Rulli", position: "GK", nationality: "Argentina", nationality_flag: "AR", club: "Villarreal", league: "La Liga", overall: 80, stats: s(40, 12, 38, 16, 14, 70) },
  { name: "Pepelu", position: "CDM", nationality: "Spain", nationality_flag: "ES", club: "Valencia", league: "La Liga", overall: 76, stats: s(54, 56, 72, 70, 76, 76) },
];

// ============================================================
// SERIE A (Italy) - 85 players
// ============================================================
const serieA = [
  // Inter Milan
  { name: "Lautaro Martinez", position: "ST", nationality: "Argentina", nationality_flag: "AR", club: "Inter Milan", league: "Serie A", overall: 88, stats: s(82, 86, 72, 84, 40, 78) },
  { name: "Nicolo Barella", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 86, stats: s(72, 74, 82, 84, 76, 76) },
  { name: "Alessandro Bastoni", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 85, stats: s(64, 38, 68, 64, 84, 78) },
  { name: "Marcus Thuram", position: "ST", nationality: "France", nationality_flag: "FR", club: "Inter Milan", league: "Serie A", overall: 82, stats: s(84, 78, 64, 80, 34, 80) },
  { name: "Henrikh Mkhitaryan", position: "CM", nationality: "Armenia", nationality_flag: "AM", club: "Inter Milan", league: "Serie A", overall: 80, stats: s(62, 72, 80, 82, 52, 62) },
  { name: "Federico Dimarco", position: "LWB", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 83, stats: s(76, 68, 80, 78, 72, 72) },
  { name: "Yann Sommer", position: "GK", nationality: "Switzerland", nationality_flag: "CH", club: "Inter Milan", league: "Serie A", overall: 84, stats: s(42, 14, 44, 18, 16, 70) },
  { name: "Denzel Dumfries", position: "RWB", nationality: "Netherlands", nationality_flag: "NL", club: "Inter Milan", league: "Serie A", overall: 81, stats: s(84, 64, 62, 72, 72, 82) },
  // AC Milan
  { name: "Rafael Leao", position: "LW", nationality: "Portugal", nationality_flag: "PT", club: "AC Milan", league: "Serie A", overall: 86, stats: s(92, 78, 72, 90, 26, 68) },
  { name: "Theo Hernandez", position: "LB", nationality: "France", nationality_flag: "FR", club: "AC Milan", league: "Serie A", overall: 85, stats: s(88, 68, 72, 80, 74, 80) },
  { name: "Mike Maignan", position: "GK", nationality: "France", nationality_flag: "FR", club: "AC Milan", league: "Serie A", overall: 86, stats: s(46, 16, 46, 22, 18, 76) },
  { name: "Christian Pulisic", position: "RW", nationality: "USA", nationality_flag: "US", club: "AC Milan", league: "Serie A", overall: 81, stats: s(82, 76, 74, 82, 36, 60) },
  { name: "Tijjani Reijnders", position: "CM", nationality: "Netherlands", nationality_flag: "NL", club: "AC Milan", league: "Serie A", overall: 80, stats: s(70, 70, 76, 82, 66, 70) },
  { name: "Fikayo Tomori", position: "CB", nationality: "England", nationality_flag: "GB", club: "AC Milan", league: "Serie A", overall: 81, stats: s(76, 32, 46, 52, 82, 78) },
  { name: "Samuel Chukwueze", position: "RW", nationality: "Nigeria", nationality_flag: "NG", club: "AC Milan", league: "Serie A", overall: 79, stats: s(84, 72, 66, 82, 28, 58) },
  { name: "Olivier Giroud", position: "ST", nationality: "France", nationality_flag: "FR", club: "AC Milan", league: "Serie A", overall: 80, stats: s(48, 80, 62, 70, 38, 80) },
  // Juventus
  { name: "Dusan Vlahovic", position: "ST", nationality: "Serbia", nationality_flag: "RS", club: "Juventus", league: "Serie A", overall: 83, stats: s(76, 84, 60, 76, 30, 80) },
  { name: "Federico Chiesa", position: "RW", nationality: "Italy", nationality_flag: "IT", club: "Juventus", league: "Serie A", overall: 82, stats: s(88, 78, 70, 84, 32, 64) },
  { name: "Adrien Rabiot", position: "CM", nationality: "France", nationality_flag: "FR", club: "Juventus", league: "Serie A", overall: 81, stats: s(62, 70, 76, 78, 72, 76) },
  { name: "Bremer", position: "CB", nationality: "Brazil", nationality_flag: "BR", club: "Juventus", league: "Serie A", overall: 83, stats: s(68, 34, 44, 48, 84, 84) },
  { name: "Wojciech Szczesny", position: "GK", nationality: "Poland", nationality_flag: "PL", club: "Juventus", league: "Serie A", overall: 83, stats: s(40, 14, 40, 18, 16, 72) },
  { name: "Andrea Cambiaso", position: "LB", nationality: "Italy", nationality_flag: "IT", club: "Juventus", league: "Serie A", overall: 79, stats: s(80, 54, 68, 74, 74, 72) },
  { name: "Gleison Bremer", position: "CB", nationality: "Brazil", nationality_flag: "BR", club: "Juventus", league: "Serie A", overall: 83, stats: s(68, 34, 44, 48, 84, 84) },
  // Napoli
  { name: "Victor Osimhen", position: "ST", nationality: "Nigeria", nationality_flag: "NG", club: "Napoli", league: "Serie A", overall: 87, stats: s(90, 84, 56, 80, 30, 78) },
  { name: "Khvicha Kvaratskhelia", position: "LW", nationality: "Georgia", nationality_flag: "GE", club: "Napoli", league: "Serie A", overall: 85, stats: s(84, 78, 74, 90, 30, 64) },
  { name: "Kim Min-jae", position: "CB", nationality: "South Korea", nationality_flag: "KR", club: "Napoli", league: "Serie A", overall: 84, stats: s(72, 36, 48, 52, 86, 82) },
  { name: "Stanislav Lobotka", position: "CDM", nationality: "Slovakia", nationality_flag: "SK", club: "Napoli", league: "Serie A", overall: 83, stats: s(56, 56, 82, 82, 76, 66) },
  { name: "Piotr Zielinski", position: "CM", nationality: "Poland", nationality_flag: "PL", club: "Napoli", league: "Serie A", overall: 82, stats: s(66, 74, 80, 84, 56, 66) },
  { name: "Giovanni Di Lorenzo", position: "RB", nationality: "Italy", nationality_flag: "IT", club: "Napoli", league: "Serie A", overall: 83, stats: s(72, 58, 68, 72, 80, 76) },
  { name: "Alex Meret", position: "GK", nationality: "Italy", nationality_flag: "IT", club: "Napoli", league: "Serie A", overall: 80, stats: s(40, 12, 38, 16, 14, 68) },
  // Roma
  { name: "Paulo Dybala", position: "CF", nationality: "Argentina", nationality_flag: "AR", club: "Roma", league: "Serie A", overall: 84, stats: s(68, 82, 82, 88, 30, 52) },
  { name: "Romelu Lukaku", position: "ST", nationality: "Belgium", nationality_flag: "BE", club: "Roma", league: "Serie A", overall: 82, stats: s(78, 82, 64, 76, 36, 86) },
  { name: "Lorenzo Pellegrini", position: "CAM", nationality: "Italy", nationality_flag: "IT", club: "Roma", league: "Serie A", overall: 81, stats: s(62, 74, 80, 82, 54, 66) },
  { name: "Gianluca Mancini", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Roma", league: "Serie A", overall: 80, stats: s(58, 42, 52, 50, 82, 80) },
  { name: "Rui Patricio", position: "GK", nationality: "Portugal", nationality_flag: "PT", club: "Roma", league: "Serie A", overall: 78, stats: s(38, 12, 36, 16, 14, 66) },
  // Atalanta
  { name: "Ademola Lookman", position: "LW", nationality: "Nigeria", nationality_flag: "NG", club: "Atalanta", league: "Serie A", overall: 82, stats: s(86, 78, 68, 84, 32, 64) },
  { name: "Gianluca Scamacca", position: "ST", nationality: "Italy", nationality_flag: "IT", club: "Atalanta", league: "Serie A", overall: 79, stats: s(72, 80, 56, 72, 30, 78) },
  { name: "Teun Koopmeiners", position: "CM", nationality: "Netherlands", nationality_flag: "NL", club: "Atalanta", league: "Serie A", overall: 82, stats: s(62, 74, 78, 78, 74, 76) },
  { name: "Charles De Ketelaere", position: "CAM", nationality: "Belgium", nationality_flag: "BE", club: "Atalanta", league: "Serie A", overall: 78, stats: s(68, 72, 72, 80, 34, 64) },
  // Lazio
  { name: "Ciro Immobile", position: "ST", nationality: "Italy", nationality_flag: "IT", club: "Lazio", league: "Serie A", overall: 82, stats: s(76, 86, 64, 78, 30, 68) },
  { name: "Sergej Milinkovic-Savic", position: "CM", nationality: "Serbia", nationality_flag: "RS", club: "Lazio", league: "Serie A", overall: 83, stats: s(58, 76, 78, 80, 68, 80) },
  { name: "Luis Alberto", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "Lazio", league: "Serie A", overall: 82, stats: s(54, 72, 84, 84, 40, 52) },
  { name: "Ivan Provedel", position: "GK", nationality: "Italy", nationality_flag: "IT", club: "Lazio", league: "Serie A", overall: 80, stats: s(40, 12, 36, 16, 14, 68) },
  // Fiorentina
  { name: "Giacomo Bonaventura", position: "CAM", nationality: "Italy", nationality_flag: "IT", club: "Fiorentina", league: "Serie A", overall: 78, stats: s(56, 72, 76, 80, 48, 62) },
  { name: "Luka Jovic", position: "ST", nationality: "Serbia", nationality_flag: "RS", club: "Fiorentina", league: "Serie A", overall: 76, stats: s(64, 78, 52, 70, 26, 74) },
  { name: "Nikola Milenkovic", position: "CB", nationality: "Serbia", nationality_flag: "RS", club: "Fiorentina", league: "Serie A", overall: 80, stats: s(60, 40, 46, 48, 82, 82) },
  { name: "Nico Gonzalez", position: "LW", nationality: "Argentina", nationality_flag: "AR", club: "Fiorentina", league: "Serie A", overall: 80, stats: s(80, 74, 68, 82, 34, 68) },
  // Torino
  { name: "Duvan Zapata", position: "ST", nationality: "Colombia", nationality_flag: "CO", club: "Torino", league: "Serie A", overall: 79, stats: s(70, 80, 56, 74, 34, 84) },
  { name: "Vanja Milinkovic-Savic", position: "GK", nationality: "Serbia", nationality_flag: "RS", club: "Torino", league: "Serie A", overall: 77, stats: s(40, 12, 34, 16, 14, 70) },
  { name: "Alessandro Buongiorno", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Torino", league: "Serie A", overall: 79, stats: s(62, 30, 48, 48, 80, 80) },
  // Bologna
  { name: "Riccardo Orsolini", position: "RW", nationality: "Italy", nationality_flag: "IT", club: "Bologna", league: "Serie A", overall: 79, stats: s(78, 76, 68, 80, 28, 62) },
  { name: "Joshua Zirkzee", position: "ST", nationality: "Netherlands", nationality_flag: "NL", club: "Bologna", league: "Serie A", overall: 78, stats: s(72, 74, 68, 80, 28, 68) },
  { name: "Lewis Ferguson", position: "CM", nationality: "Scotland", nationality_flag: "GB", club: "Bologna", league: "Serie A", overall: 78, stats: s(62, 70, 74, 74, 72, 74) },
  // Monza
  { name: "Matteo Pessina", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "Monza", league: "Serie A", overall: 76, stats: s(62, 68, 72, 74, 64, 68) },
  { name: "Andrea Colpani", position: "RW", nationality: "Italy", nationality_flag: "IT", club: "Monza", league: "Serie A", overall: 76, stats: s(70, 72, 70, 78, 34, 60) },
  // Sassuolo
  { name: "Domenico Berardi", position: "RW", nationality: "Italy", nationality_flag: "IT", club: "Sassuolo", league: "Serie A", overall: 80, stats: s(72, 78, 76, 84, 30, 60) },
  { name: "Davide Frattesi", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 78, stats: s(74, 72, 70, 74, 68, 74) },
  // Udinese
  { name: "Gerard Deulofeu", position: "LW", nationality: "Spain", nationality_flag: "ES", club: "Udinese", league: "Serie A", overall: 77, stats: s(78, 72, 66, 82, 26, 54) },
  { name: "Lazar Samardzic", position: "CAM", nationality: "Serbia", nationality_flag: "RS", club: "Udinese", league: "Serie A", overall: 76, stats: s(66, 70, 74, 80, 36, 56) },
  // Verona
  { name: "Ondrej Duda", position: "CAM", nationality: "Slovakia", nationality_flag: "SK", club: "Verona", league: "Serie A", overall: 74, stats: s(60, 72, 74, 76, 38, 58) },
  // Lecce
  { name: "Nikola Krstovic", position: "ST", nationality: "Montenegro", nationality_flag: "ME", club: "Lecce", league: "Serie A", overall: 73, stats: s(72, 74, 46, 66, 26, 74) },
  // Empoli
  { name: "M'Baye Niang", position: "ST", nationality: "Senegal", nationality_flag: "SN", club: "Empoli", league: "Serie A", overall: 72, stats: s(78, 72, 50, 72, 28, 74) },
  // Cagliari
  { name: "Gianluca Gaetano", position: "CAM", nationality: "Italy", nationality_flag: "IT", club: "Cagliari", league: "Serie A", overall: 73, stats: s(64, 68, 72, 76, 36, 56) },
  { name: "Alberto Dossena", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Cagliari", league: "Serie A", overall: 72, stats: s(58, 32, 48, 46, 74, 76) },
  // Genoa
  { name: "Albert Gudmundsson", position: "CF", nationality: "Iceland", nationality_flag: "IS", club: "Genoa", league: "Serie A", overall: 79, stats: s(72, 78, 72, 82, 32, 62) },
  { name: "Mateo Retegui", position: "ST", nationality: "Argentina", nationality_flag: "AR", club: "Genoa", league: "Serie A", overall: 76, stats: s(72, 76, 48, 68, 28, 76) },
  // Salernitana
  { name: "Boulaye Dia", position: "ST", nationality: "Senegal", nationality_flag: "SN", club: "Salernitana", league: "Serie A", overall: 76, stats: s(82, 76, 54, 74, 26, 68) },
  // Frosinone
  { name: "Matias Soule", position: "RW", nationality: "Argentina", nationality_flag: "AR", club: "Frosinone", league: "Serie A", overall: 74, stats: s(76, 68, 68, 80, 24, 52) },
  // Additional Serie A depth
  { name: "Stefan de Vrij", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Inter Milan", league: "Serie A", overall: 81, stats: s(52, 40, 58, 54, 82, 76) },
  { name: "Francesco Acerbi", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 80, stats: s(48, 38, 54, 48, 82, 78) },
  { name: "Matteo Darmian", position: "RB", nationality: "Italy", nationality_flag: "IT", club: "Inter Milan", league: "Serie A", overall: 76, stats: s(66, 42, 58, 62, 76, 74) },
  { name: "Sandro Tonali", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "Newcastle", league: "Serie A", overall: 80, stats: s(64, 66, 76, 78, 78, 76) },
  { name: "Giorgio Scalvini", position: "CB", nationality: "Italy", nationality_flag: "IT", club: "Atalanta", league: "Serie A", overall: 76, stats: s(66, 34, 52, 56, 76, 76) },
  { name: "Mattia Zaccagni", position: "LW", nationality: "Italy", nationality_flag: "IT", club: "Lazio", league: "Serie A", overall: 80, stats: s(78, 74, 72, 84, 30, 60) },
  { name: "Matteo Guendouzi", position: "CM", nationality: "France", nationality_flag: "FR", club: "Lazio", league: "Serie A", overall: 79, stats: s(66, 62, 74, 76, 72, 76) },
  { name: "Mario Pasalic", position: "CAM", nationality: "Croatia", nationality_flag: "HR", club: "Atalanta", league: "Serie A", overall: 78, stats: s(64, 74, 72, 76, 52, 72) },
  { name: "Pietro Pellegri", position: "ST", nationality: "Italy", nationality_flag: "IT", club: "Torino", league: "Serie A", overall: 70, stats: s(76, 68, 44, 66, 22, 66) },
  { name: "Marco Carnesecchi", position: "GK", nationality: "Italy", nationality_flag: "IT", club: "Atalanta", league: "Serie A", overall: 76, stats: s(38, 10, 34, 14, 12, 66) },
  { name: "Danilo", position: "RB", nationality: "Brazil", nationality_flag: "BR", club: "Juventus", league: "Serie A", overall: 78, stats: s(68, 48, 62, 66, 76, 76) },
  { name: "Alex Sandro", position: "LB", nationality: "Brazil", nationality_flag: "BR", club: "Juventus", league: "Serie A", overall: 77, stats: s(72, 48, 62, 68, 74, 74) },
  { name: "Weston McKennie", position: "CM", nationality: "USA", nationality_flag: "US", club: "Juventus", league: "Serie A", overall: 77, stats: s(70, 66, 68, 72, 72, 78) },
  { name: "Kenan Yildiz", position: "LW", nationality: "Turkey", nationality_flag: "TR", club: "Juventus", league: "Serie A", overall: 74, stats: s(78, 66, 66, 80, 24, 52) },
];

// ============================================================
// BUNDESLIGA (Germany) - 85 players
// ============================================================
const bundesliga = [
  // Bayern Munich
  { name: "Harry Kane", position: "ST", nationality: "England", nationality_flag: "GB", club: "Bayern Munich", league: "Bundesliga", overall: 91, stats: s(72, 92, 82, 82, 46, 80) },
  { name: "Jamal Musiala", position: "CAM", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 86, stats: s(78, 76, 80, 90, 38, 58) },
  { name: "Leroy Sane", position: "RW", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 84, stats: s(90, 78, 76, 86, 30, 58) },
  { name: "Joshua Kimmich", position: "CDM", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 87, stats: s(64, 68, 86, 80, 82, 74) },
  { name: "Manuel Neuer", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 86, stats: s(46, 16, 52, 22, 18, 76) },
  { name: "Dayot Upamecano", position: "CB", nationality: "France", nationality_flag: "FR", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(74, 36, 50, 54, 82, 82) },
  { name: "Leon Goretzka", position: "CM", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(68, 74, 76, 78, 72, 80) },
  { name: "Alphonso Davies", position: "LB", nationality: "Canada", nationality_flag: "CA", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(94, 56, 68, 80, 72, 72) },
  { name: "Matthijs de Ligt", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(60, 38, 56, 56, 84, 80) },
  { name: "Serge Gnabry", position: "RW", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(84, 78, 72, 82, 32, 64) },
  { name: "Kim Min-jae", position: "CB", nationality: "South Korea", nationality_flag: "KR", club: "Bayern Munich", league: "Bundesliga", overall: 84, stats: s(72, 36, 48, 52, 86, 82) },
  { name: "Thomas Muller", position: "CF", nationality: "Germany", nationality_flag: "DE", club: "Bayern Munich", league: "Bundesliga", overall: 82, stats: s(60, 78, 78, 78, 46, 66) },
  { name: "Konrad Laimer", position: "CDM", nationality: "Austria", nationality_flag: "AT", club: "Bayern Munich", league: "Bundesliga", overall: 79, stats: s(76, 60, 68, 72, 78, 80) },
  // Borussia Dortmund
  { name: "Marco Reus", position: "CAM", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 82, stats: s(72, 80, 82, 84, 36, 56) },
  { name: "Mats Hummels", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 82, stats: s(38, 42, 66, 60, 86, 72) },
  { name: "Gregor Kobel", position: "GK", nationality: "Switzerland", nationality_flag: "CH", club: "Dortmund", league: "Bundesliga", overall: 84, stats: s(44, 14, 42, 18, 16, 74) },
  { name: "Karim Adeyemi", position: "LW", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 79, stats: s(92, 72, 64, 82, 26, 56) },
  { name: "Julian Brandt", position: "CAM", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 82, stats: s(68, 74, 82, 84, 42, 60) },
  { name: "Nico Schlotterbeck", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 81, stats: s(62, 36, 58, 56, 82, 78) },
  { name: "Marcel Sabitzer", position: "CM", nationality: "Austria", nationality_flag: "AT", club: "Dortmund", league: "Bundesliga", overall: 80, stats: s(68, 76, 76, 76, 66, 74) },
  { name: "Niclas Fullkrug", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Dortmund", league: "Bundesliga", overall: 81, stats: s(62, 82, 58, 72, 32, 80) },
  { name: "Donyell Malen", position: "CF", nationality: "Netherlands", nationality_flag: "NL", club: "Dortmund", league: "Bundesliga", overall: 80, stats: s(88, 78, 68, 82, 30, 60) },
  { name: "Ian Maatsen", position: "LB", nationality: "Netherlands", nationality_flag: "NL", club: "Dortmund", league: "Bundesliga", overall: 78, stats: s(82, 52, 66, 74, 72, 70) },
  // RB Leipzig
  { name: "Xavi Simons", position: "CAM", nationality: "Netherlands", nationality_flag: "NL", club: "RB Leipzig", league: "Bundesliga", overall: 81, stats: s(80, 72, 76, 84, 36, 54) },
  { name: "Dani Olmo", position: "CAM", nationality: "Spain", nationality_flag: "ES", club: "RB Leipzig", league: "Bundesliga", overall: 83, stats: s(68, 76, 82, 86, 44, 60) },
  { name: "Loïs Openda", position: "ST", nationality: "Belgium", nationality_flag: "BE", club: "RB Leipzig", league: "Bundesliga", overall: 81, stats: s(90, 78, 56, 80, 28, 68) },
  { name: "Mohamed Simakan", position: "CB", nationality: "France", nationality_flag: "FR", club: "RB Leipzig", league: "Bundesliga", overall: 79, stats: s(72, 30, 46, 50, 80, 80) },
  { name: "Peter Gulacsi", position: "GK", nationality: "Hungary", nationality_flag: "HU", club: "RB Leipzig", league: "Bundesliga", overall: 82, stats: s(40, 12, 40, 16, 14, 70) },
  { name: "Benjamin Henrichs", position: "RB", nationality: "Germany", nationality_flag: "DE", club: "RB Leipzig", league: "Bundesliga", overall: 78, stats: s(78, 52, 66, 72, 74, 76) },
  { name: "Kevin Kampl", position: "CDM", nationality: "Slovenia", nationality_flag: "SI", club: "RB Leipzig", league: "Bundesliga", overall: 78, stats: s(58, 58, 76, 76, 72, 68) },
  // Bayer Leverkusen
  { name: "Florian Wirtz", position: "CAM", nationality: "Germany", nationality_flag: "DE", club: "Bayer Leverkusen", league: "Bundesliga", overall: 86, stats: s(72, 76, 82, 90, 40, 54) },
  { name: "Granit Xhaka", position: "CM", nationality: "Switzerland", nationality_flag: "CH", club: "Bayer Leverkusen", league: "Bundesliga", overall: 83, stats: s(52, 70, 80, 74, 78, 78) },
  { name: "Jonathan Tah", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Bayer Leverkusen", league: "Bundesliga", overall: 82, stats: s(58, 36, 52, 50, 84, 84) },
  { name: "Jeremie Frimpong", position: "RWB", nationality: "Netherlands", nationality_flag: "NL", club: "Bayer Leverkusen", league: "Bundesliga", overall: 82, stats: s(92, 68, 68, 80, 64, 72) },
  { name: "Alejandro Grimaldo", position: "LB", nationality: "Spain", nationality_flag: "ES", club: "Bayer Leverkusen", league: "Bundesliga", overall: 83, stats: s(74, 68, 80, 78, 72, 68) },
  { name: "Patrik Schick", position: "ST", nationality: "Czech Republic", nationality_flag: "CZ", club: "Bayer Leverkusen", league: "Bundesliga", overall: 80, stats: s(72, 82, 60, 74, 28, 72) },
  { name: "Exequiel Palacios", position: "CM", nationality: "Argentina", nationality_flag: "AR", club: "Bayer Leverkusen", league: "Bundesliga", overall: 79, stats: s(64, 64, 76, 78, 70, 68) },
  { name: "Victor Boniface", position: "ST", nationality: "Nigeria", nationality_flag: "NG", club: "Bayer Leverkusen", league: "Bundesliga", overall: 80, stats: s(78, 78, 58, 80, 30, 78) },
  // Stuttgart
  { name: "Serhou Guirassy", position: "ST", nationality: "Guinea", nationality_flag: "GN", club: "Stuttgart", league: "Bundesliga", overall: 80, stats: s(74, 82, 54, 74, 28, 78) },
  { name: "Chris Fuhrich", position: "LW", nationality: "Germany", nationality_flag: "DE", club: "Stuttgart", league: "Bundesliga", overall: 78, stats: s(84, 70, 68, 80, 30, 62) },
  { name: "Waldemar Anton", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Stuttgart", league: "Bundesliga", overall: 79, stats: s(62, 34, 52, 50, 80, 80) },
  { name: "Hiroki Ito", position: "CB", nationality: "Japan", nationality_flag: "JP", club: "Stuttgart", league: "Bundesliga", overall: 78, stats: s(64, 30, 52, 52, 78, 78) },
  // Eintracht Frankfurt
  { name: "Omar Marmoush", position: "LW", nationality: "Egypt", nationality_flag: "EG", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 78, stats: s(88, 74, 64, 80, 28, 62) },
  { name: "Hugo Ekitike", position: "ST", nationality: "France", nationality_flag: "FR", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 76, stats: s(82, 72, 58, 78, 24, 58) },
  { name: "Robin Koch", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 78, stats: s(60, 36, 56, 50, 80, 78) },
  { name: "Kevin Trapp", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 81, stats: s(40, 14, 40, 18, 16, 70) },
  // Wolfsburg
  { name: "Jonas Wind", position: "ST", nationality: "Denmark", nationality_flag: "DK", club: "Wolfsburg", league: "Bundesliga", overall: 77, stats: s(64, 78, 58, 72, 32, 76) },
  { name: "Patrick Wimmer", position: "RW", nationality: "Austria", nationality_flag: "AT", club: "Wolfsburg", league: "Bundesliga", overall: 75, stats: s(80, 66, 64, 78, 30, 62) },
  { name: "Koen Casteels", position: "GK", nationality: "Belgium", nationality_flag: "BE", club: "Wolfsburg", league: "Bundesliga", overall: 82, stats: s(42, 14, 38, 18, 16, 72) },
  // Freiburg
  { name: "Vincenzo Grifo", position: "LM", nationality: "Italy", nationality_flag: "IT", club: "Freiburg", league: "Bundesliga", overall: 79, stats: s(68, 76, 78, 80, 36, 58) },
  { name: "Michael Gregoritsch", position: "ST", nationality: "Austria", nationality_flag: "AT", club: "Freiburg", league: "Bundesliga", overall: 77, stats: s(64, 76, 58, 72, 30, 74) },
  { name: "Ritsu Doan", position: "RW", nationality: "Japan", nationality_flag: "JP", club: "Freiburg", league: "Bundesliga", overall: 77, stats: s(78, 72, 68, 80, 28, 56) },
  // Borussia Monchengladbach
  { name: "Jonas Hofmann", position: "RM", nationality: "Germany", nationality_flag: "DE", club: "Monchengladbach", league: "Bundesliga", overall: 79, stats: s(74, 70, 78, 78, 52, 66) },
  { name: "Ko Itakura", position: "CB", nationality: "Japan", nationality_flag: "JP", club: "Monchengladbach", league: "Bundesliga", overall: 77, stats: s(60, 32, 52, 50, 78, 78) },
  // Union Berlin
  { name: "Robin Gosens", position: "LWB", nationality: "Germany", nationality_flag: "DE", club: "Union Berlin", league: "Bundesliga", overall: 78, stats: s(78, 64, 66, 72, 70, 76) },
  { name: "Kevin Volland", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Union Berlin", league: "Bundesliga", overall: 76, stats: s(68, 76, 64, 72, 34, 72) },
  // Hoffenheim
  { name: "Andrej Kramaric", position: "CF", nationality: "Croatia", nationality_flag: "HR", club: "Hoffenheim", league: "Bundesliga", overall: 80, stats: s(68, 80, 76, 82, 30, 58) },
  { name: "Maximilian Beier", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Hoffenheim", league: "Bundesliga", overall: 76, stats: s(82, 72, 54, 74, 24, 62) },
  // Werder Bremen
  { name: "Marvin Ducksch", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Werder Bremen", league: "Bundesliga", overall: 77, stats: s(66, 78, 62, 74, 28, 72) },
  { name: "Jiri Pavlenka", position: "GK", nationality: "Czech Republic", nationality_flag: "CZ", club: "Werder Bremen", league: "Bundesliga", overall: 77, stats: s(38, 12, 36, 16, 14, 68) },
  { name: "Mitchell Weiser", position: "RB", nationality: "Germany", nationality_flag: "DE", club: "Werder Bremen", league: "Bundesliga", overall: 76, stats: s(76, 56, 66, 72, 70, 72) },
  // Augsburg
  { name: "Ermedin Demirovic", position: "ST", nationality: "Bosnia", nationality_flag: "BA", club: "Augsburg", league: "Bundesliga", overall: 76, stats: s(72, 74, 56, 72, 28, 76) },
  { name: "Jeffrey Gouweleeuw", position: "CB", nationality: "Netherlands", nationality_flag: "NL", club: "Augsburg", league: "Bundesliga", overall: 74, stats: s(48, 32, 48, 44, 76, 76) },
  // Mainz
  { name: "Jonathan Burkardt", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Mainz", league: "Bundesliga", overall: 76, stats: s(78, 74, 56, 74, 28, 72) },
  { name: "Brajan Gruda", position: "RW", nationality: "Germany", nationality_flag: "DE", club: "Mainz", league: "Bundesliga", overall: 73, stats: s(82, 66, 64, 78, 24, 52) },
  // Heidenheim
  { name: "Tim Kleindienst", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Heidenheim", league: "Bundesliga", overall: 74, stats: s(66, 74, 48, 64, 28, 80) },
  { name: "Jan-Niklas Beste", position: "LM", nationality: "Germany", nationality_flag: "DE", club: "Heidenheim", league: "Bundesliga", overall: 74, stats: s(72, 66, 72, 76, 36, 60) },
  // Darmstadt
  { name: "Phillip Tietz", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Darmstadt", league: "Bundesliga", overall: 70, stats: s(68, 70, 44, 64, 26, 74) },
  { name: "Marcel Schuhen", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Darmstadt", league: "Bundesliga", overall: 68, stats: s(36, 10, 30, 14, 12, 64) },
  // Koln
  { name: "Florian Kainz", position: "LM", nationality: "Austria", nationality_flag: "AT", club: "Koln", league: "Bundesliga", overall: 75, stats: s(70, 72, 74, 78, 34, 58) },
  { name: "Davie Selke", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Koln", league: "Bundesliga", overall: 72, stats: s(68, 72, 44, 62, 30, 78) },
  // Bochum
  { name: "Takuma Asano", position: "RW", nationality: "Japan", nationality_flag: "JP", club: "Bochum", league: "Bundesliga", overall: 73, stats: s(86, 66, 58, 76, 30, 60) },
  { name: "Philipp Hofmann", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Bochum", league: "Bundesliga", overall: 71, stats: s(52, 72, 44, 60, 30, 80) },
  // Additional Bundesliga
  { name: "Janis Blaswich", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "RB Leipzig", league: "Bundesliga", overall: 75, stats: s(38, 10, 34, 14, 12, 66) },
  { name: "Willi Orban", position: "CB", nationality: "Hungary", nationality_flag: "HU", club: "RB Leipzig", league: "Bundesliga", overall: 78, stats: s(56, 38, 48, 46, 80, 80) },
  { name: "Odilon Kossounou", position: "CB", nationality: "Ivory Coast", nationality_flag: "CI", club: "Bayer Leverkusen", league: "Bundesliga", overall: 78, stats: s(72, 30, 44, 48, 78, 82) },
  { name: "Enzo Millot", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Stuttgart", league: "Bundesliga", overall: 76, stats: s(68, 70, 72, 78, 40, 60) },
  { name: "Deniz Undav", position: "ST", nationality: "Germany", nationality_flag: "DE", club: "Stuttgart", league: "Bundesliga", overall: 77, stats: s(72, 76, 56, 74, 28, 74) },
  { name: "Angelo Stiller", position: "CDM", nationality: "Germany", nationality_flag: "DE", club: "Stuttgart", league: "Bundesliga", overall: 76, stats: s(58, 58, 74, 74, 76, 72) },
  { name: "Silas Katompa", position: "RW", nationality: "DR Congo", nationality_flag: "CD", club: "Stuttgart", league: "Bundesliga", overall: 75, stats: s(90, 68, 56, 78, 24, 62) },
  { name: "Louka Kuzma", position: "GK", nationality: "Germany", nationality_flag: "DE", club: "Stuttgart", league: "Bundesliga", overall: 72, stats: s(38, 10, 32, 14, 12, 66) },
  { name: "Ellyes Skhiri", position: "CDM", nationality: "Tunisia", nationality_flag: "TN", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 77, stats: s(60, 58, 70, 72, 78, 78) },
  { name: "Ansgar Knauff", position: "RW", nationality: "Germany", nationality_flag: "DE", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 74, stats: s(84, 64, 62, 76, 34, 62) },
  { name: "Randal Kolo Muani", position: "ST", nationality: "France", nationality_flag: "FR", club: "Eintracht Frankfurt", league: "Bundesliga", overall: 81, stats: s(86, 76, 62, 78, 40, 72) },
  { name: "Lukas Hradecky", position: "GK", nationality: "Finland", nationality_flag: "FI", club: "Bayer Leverkusen", league: "Bundesliga", overall: 82, stats: s(40, 12, 38, 16, 14, 72) },
];

// ============================================================
// LIGUE 1 (France) - 85 players
// ============================================================
const ligue1 = [
  // PSG
  { name: "Kylian Mbappe", position: "ST", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 91, stats: s(97, 88, 78, 92, 34, 76) },
  { name: "Ousmane Dembele", position: "RW", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 83, stats: s(90, 74, 74, 88, 30, 52) },
  { name: "Marquinhos", position: "CB", nationality: "Brazil", nationality_flag: "BR", club: "PSG", league: "Ligue 1", overall: 86, stats: s(62, 40, 58, 58, 88, 80) },
  { name: "Achraf Hakimi", position: "RWB", nationality: "Morocco", nationality_flag: "MA", club: "PSG", league: "Ligue 1", overall: 84, stats: s(90, 64, 72, 80, 74, 74) },
  { name: "Gianluigi Donnarumma", position: "GK", nationality: "Italy", nationality_flag: "IT", club: "PSG", league: "Ligue 1", overall: 86, stats: s(44, 14, 40, 20, 18, 78) },
  { name: "Vitinha", position: "CM", nationality: "Portugal", nationality_flag: "PT", club: "PSG", league: "Ligue 1", overall: 83, stats: s(66, 68, 82, 84, 66, 62) },
  { name: "Manuel Ugarte", position: "CDM", nationality: "Uruguay", nationality_flag: "UY", club: "PSG", league: "Ligue 1", overall: 80, stats: s(64, 52, 70, 72, 80, 80) },
  { name: "Randal Kolo Muani", position: "ST", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 81, stats: s(86, 76, 62, 78, 40, 72) },
  { name: "Warren Zaire-Emery", position: "CM", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 78, stats: s(70, 66, 72, 76, 72, 72) },
  { name: "Lucas Hernandez", position: "CB", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 82, stats: s(66, 32, 54, 54, 82, 80) },
  { name: "Presnel Kimpembe", position: "CB", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 80, stats: s(66, 32, 48, 50, 82, 80) },
  { name: "Nuno Mendes", position: "LB", nationality: "Portugal", nationality_flag: "PT", club: "PSG", league: "Ligue 1", overall: 81, stats: s(86, 48, 68, 76, 74, 72) },
  // Marseille
  { name: "Pierre-Emerick Aubameyang", position: "ST", nationality: "Gabon", nationality_flag: "GA", club: "Marseille", league: "Ligue 1", overall: 80, stats: s(84, 82, 64, 78, 28, 64) },
  { name: "Amine Harit", position: "CAM", nationality: "Morocco", nationality_flag: "MA", club: "Marseille", league: "Ligue 1", overall: 77, stats: s(70, 68, 74, 82, 34, 56) },
  { name: "Chancel Mbemba", position: "CB", nationality: "DR Congo", nationality_flag: "CD", club: "Marseille", league: "Ligue 1", overall: 78, stats: s(62, 32, 44, 44, 80, 82) },
  { name: "Iliman Ndiaye", position: "CF", nationality: "Senegal", nationality_flag: "SN", club: "Marseille", league: "Ligue 1", overall: 77, stats: s(76, 72, 68, 82, 30, 60) },
  { name: "Pau Lopez", position: "GK", nationality: "Spain", nationality_flag: "ES", club: "Marseille", league: "Ligue 1", overall: 79, stats: s(38, 12, 40, 16, 14, 68) },
  // Lyon
  { name: "Alexandre Lacazette", position: "ST", nationality: "France", nationality_flag: "FR", club: "Lyon", league: "Ligue 1", overall: 80, stats: s(68, 80, 72, 80, 36, 72) },
  { name: "Corentin Tolisso", position: "CM", nationality: "France", nationality_flag: "FR", club: "Lyon", league: "Ligue 1", overall: 78, stats: s(64, 70, 74, 74, 68, 74) },
  { name: "Nicolas Tagliafico", position: "LB", nationality: "Argentina", nationality_flag: "AR", club: "Lyon", league: "Ligue 1", overall: 79, stats: s(72, 42, 62, 66, 78, 76) },
  { name: "Rayan Cherki", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Lyon", league: "Ligue 1", overall: 76, stats: s(72, 68, 72, 82, 28, 48) },
  { name: "Jake O'Brien", position: "CB", nationality: "Ireland", nationality_flag: "IE", club: "Lyon", league: "Ligue 1", overall: 74, stats: s(56, 32, 42, 42, 76, 78) },
  // Monaco
  { name: "Wissam Ben Yedder", position: "ST", nationality: "France", nationality_flag: "FR", club: "Monaco", league: "Ligue 1", overall: 81, stats: s(72, 82, 72, 82, 34, 58) },
  { name: "Youssouf Fofana", position: "CM", nationality: "France", nationality_flag: "FR", club: "Monaco", league: "Ligue 1", overall: 80, stats: s(68, 64, 74, 76, 78, 78) },
  { name: "Aleksandr Golovin", position: "CAM", nationality: "Russia", nationality_flag: "RU", club: "Monaco", league: "Ligue 1", overall: 79, stats: s(70, 70, 78, 82, 38, 58) },
  { name: "Takumi Minamino", position: "LW", nationality: "Japan", nationality_flag: "JP", club: "Monaco", league: "Ligue 1", overall: 76, stats: s(78, 72, 68, 78, 30, 58) },
  { name: "Breel Embolo", position: "ST", nationality: "Switzerland", nationality_flag: "CH", club: "Monaco", league: "Ligue 1", overall: 77, stats: s(82, 74, 56, 76, 32, 78) },
  { name: "Mohamed Camara", position: "CDM", nationality: "Mali", nationality_flag: "ML", club: "Monaco", league: "Ligue 1", overall: 78, stats: s(72, 56, 72, 74, 78, 78) },
  // Lille
  { name: "Jonathan David", position: "ST", nationality: "Canada", nationality_flag: "CA", club: "Lille", league: "Ligue 1", overall: 82, stats: s(82, 82, 62, 80, 34, 66) },
  { name: "Leny Yoro", position: "CB", nationality: "France", nationality_flag: "FR", club: "Lille", league: "Ligue 1", overall: 76, stats: s(70, 28, 46, 50, 76, 76) },
  { name: "Remy Cabella", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Lille", league: "Ligue 1", overall: 74, stats: s(66, 68, 74, 80, 34, 52) },
  { name: "Timothy Weah", position: "RW", nationality: "USA", nationality_flag: "US", club: "Lille", league: "Ligue 1", overall: 76, stats: s(84, 68, 62, 78, 28, 62) },
  { name: "Lucas Chevalier", position: "GK", nationality: "France", nationality_flag: "FR", club: "Lille", league: "Ligue 1", overall: 78, stats: s(40, 12, 36, 16, 14, 70) },
  // Nice
  { name: "Khephren Thuram", position: "CM", nationality: "France", nationality_flag: "FR", club: "Nice", league: "Ligue 1", overall: 78, stats: s(70, 64, 72, 76, 72, 78) },
  { name: "Jeremie Boga", position: "LW", nationality: "Ivory Coast", nationality_flag: "CI", club: "Nice", league: "Ligue 1", overall: 77, stats: s(82, 68, 66, 86, 24, 52) },
  { name: "Kasper Schmeichel", position: "GK", nationality: "Denmark", nationality_flag: "DK", club: "Nice", league: "Ligue 1", overall: 79, stats: s(38, 14, 38, 16, 14, 70) },
  { name: "Jean-Clair Todibo", position: "CB", nationality: "France", nationality_flag: "FR", club: "Nice", league: "Ligue 1", overall: 79, stats: s(68, 30, 52, 56, 80, 78) },
  // Rennes
  { name: "Martin Terrier", position: "LW", nationality: "France", nationality_flag: "FR", club: "Rennes", league: "Ligue 1", overall: 79, stats: s(78, 78, 68, 80, 32, 60) },
  { name: "Arnaud Kalimuendo", position: "ST", nationality: "France", nationality_flag: "FR", club: "Rennes", league: "Ligue 1", overall: 76, stats: s(78, 74, 56, 76, 28, 64) },
  { name: "Steve Mandanda", position: "GK", nationality: "France", nationality_flag: "FR", club: "Rennes", league: "Ligue 1", overall: 76, stats: s(36, 12, 36, 14, 14, 66) },
  { name: "Benjamin Bourigeaud", position: "RM", nationality: "France", nationality_flag: "FR", club: "Rennes", league: "Ligue 1", overall: 79, stats: s(72, 72, 78, 78, 52, 68) },
  // Lens
  { name: "Elye Wahi", position: "ST", nationality: "France", nationality_flag: "FR", club: "Lens", league: "Ligue 1", overall: 76, stats: s(84, 74, 50, 76, 24, 62) },
  { name: "Florian Sotoca", position: "ST", nationality: "France", nationality_flag: "FR", club: "Lens", league: "Ligue 1", overall: 76, stats: s(72, 74, 60, 72, 40, 76) },
  { name: "Kevin Danso", position: "CB", nationality: "Austria", nationality_flag: "AT", club: "Lens", league: "Ligue 1", overall: 79, stats: s(66, 32, 44, 46, 82, 82) },
  { name: "Brice Samba", position: "GK", nationality: "France", nationality_flag: "FR", club: "Lens", league: "Ligue 1", overall: 80, stats: s(40, 12, 38, 16, 14, 70) },
  // Montpellier
  { name: "Teji Savanier", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Montpellier", league: "Ligue 1", overall: 79, stats: s(56, 74, 82, 82, 46, 58) },
  { name: "Elye Wahi", position: "ST", nationality: "France", nationality_flag: "FR", club: "Montpellier", league: "Ligue 1", overall: 74, stats: s(82, 72, 48, 74, 22, 60) },
  // Toulouse
  { name: "Thijs Dallinga", position: "ST", nationality: "Netherlands", nationality_flag: "NL", club: "Toulouse", league: "Ligue 1", overall: 74, stats: s(72, 74, 50, 70, 28, 72) },
  { name: "Zakaria Aboukhlal", position: "LW", nationality: "Morocco", nationality_flag: "MA", club: "Toulouse", league: "Ligue 1", overall: 73, stats: s(80, 68, 60, 78, 24, 56) },
  // Strasbourg
  { name: "Habib Diarra", position: "CM", nationality: "Senegal", nationality_flag: "SN", club: "Strasbourg", league: "Ligue 1", overall: 73, stats: s(70, 64, 68, 74, 62, 72) },
  { name: "Kevin Gameiro", position: "ST", nationality: "France", nationality_flag: "FR", club: "Strasbourg", league: "Ligue 1", overall: 73, stats: s(66, 76, 56, 72, 26, 62) },
  // Nantes
  { name: "Moses Simon", position: "LW", nationality: "Nigeria", nationality_flag: "NG", club: "Nantes", league: "Ligue 1", overall: 76, stats: s(88, 68, 66, 82, 24, 54) },
  { name: "Ludovic Blas", position: "CAM", nationality: "France", nationality_flag: "FR", club: "Nantes", league: "Ligue 1", overall: 78, stats: s(66, 74, 78, 82, 36, 56) },
  // Reims
  { name: "Folarin Balogun", position: "ST", nationality: "USA", nationality_flag: "US", club: "Reims", league: "Ligue 1", overall: 76, stats: s(80, 76, 52, 74, 26, 64) },
  { name: "Junya Ito", position: "RW", nationality: "Japan", nationality_flag: "JP", club: "Reims", league: "Ligue 1", overall: 75, stats: s(86, 66, 64, 80, 26, 56) },
  // Brest
  { name: "Steve Mounie", position: "ST", nationality: "Benin", nationality_flag: "BJ", club: "Brest", league: "Ligue 1", overall: 73, stats: s(68, 72, 44, 62, 30, 80) },
  { name: "Hugo Magnetti", position: "CDM", nationality: "France", nationality_flag: "FR", club: "Brest", league: "Ligue 1", overall: 74, stats: s(60, 54, 68, 68, 74, 74) },
  // Le Havre
  { name: "Nabil Alioui", position: "ST", nationality: "France", nationality_flag: "FR", club: "Le Havre", league: "Ligue 1", overall: 68, stats: s(76, 66, 42, 66, 20, 62) },
  { name: "Christopher Operi", position: "RB", nationality: "France", nationality_flag: "FR", club: "Le Havre", league: "Ligue 1", overall: 68, stats: s(72, 38, 52, 58, 66, 70) },
  // Clermont
  { name: "Muhammed Cham", position: "LW", nationality: "Gambia", nationality_flag: "GM", club: "Clermont", league: "Ligue 1", overall: 68, stats: s(82, 62, 56, 74, 22, 54) },
  // Lorient
  { name: "Ibrahima Kone", position: "ST", nationality: "Mali", nationality_flag: "ML", club: "Lorient", league: "Ligue 1", overall: 72, stats: s(76, 72, 44, 68, 22, 72) },
  // Metz
  { name: "Lamine Camara", position: "CM", nationality: "Senegal", nationality_flag: "SN", club: "Metz", league: "Ligue 1", overall: 72, stats: s(68, 60, 68, 72, 66, 68) },
  // Additional Ligue 1
  { name: "Bradley Barcola", position: "LW", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 77, stats: s(86, 68, 64, 82, 24, 52) },
  { name: "Nordi Mukiele", position: "RB", nationality: "France", nationality_flag: "FR", club: "PSG", league: "Ligue 1", overall: 78, stats: s(76, 40, 56, 62, 78, 80) },
  { name: "Fabian Ruiz", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "PSG", league: "Ligue 1", overall: 81, stats: s(58, 72, 80, 80, 66, 66) },
  { name: "Danilo Pereira", position: "CDM", nationality: "Portugal", nationality_flag: "PT", club: "PSG", league: "Ligue 1", overall: 79, stats: s(56, 54, 64, 62, 80, 82) },
  { name: "Gonçalo Ramos", position: "ST", nationality: "Portugal", nationality_flag: "PT", club: "PSG", league: "Ligue 1", overall: 80, stats: s(78, 80, 62, 76, 30, 72) },
  { name: "Mike Maignan", position: "GK", nationality: "France", nationality_flag: "FR", club: "AC Milan", league: "Ligue 1", overall: 86, stats: s(46, 16, 46, 22, 18, 76) },
  { name: "Matteo Guendouzi", position: "CM", nationality: "France", nationality_flag: "FR", club: "Marseille", league: "Ligue 1", overall: 79, stats: s(66, 62, 74, 76, 72, 76) },
  { name: "Ismaila Sarr", position: "RW", nationality: "Senegal", nationality_flag: "SN", club: "Marseille", league: "Ligue 1", overall: 77, stats: s(90, 72, 60, 80, 28, 62) },
  { name: "Castello Lukeba", position: "CB", nationality: "France", nationality_flag: "FR", club: "RB Leipzig", league: "Ligue 1", overall: 77, stats: s(70, 28, 48, 52, 78, 76) },
  { name: "Malick Thiaw", position: "CB", nationality: "Germany", nationality_flag: "DE", club: "AC Milan", league: "Ligue 1", overall: 76, stats: s(66, 28, 44, 48, 76, 78) },
  { name: "Amine Gouiri", position: "CF", nationality: "France", nationality_flag: "FR", club: "Rennes", league: "Ligue 1", overall: 78, stats: s(76, 76, 70, 80, 30, 62) },
  { name: "Boubacar Kamara", position: "CDM", nationality: "France", nationality_flag: "FR", club: "Aston Villa", league: "Ligue 1", overall: 79, stats: s(60, 48, 72, 72, 80, 76) },
  { name: "Jordan Veretout", position: "CM", nationality: "France", nationality_flag: "FR", club: "Marseille", league: "Ligue 1", overall: 77, stats: s(60, 66, 74, 72, 72, 72) },
  { name: "Neymar Jr", position: "LW", nationality: "Brazil", nationality_flag: "BR", club: "PSG", league: "Ligue 1", overall: 85, stats: s(80, 82, 84, 94, 30, 50) },
  { name: "Marco Verratti", position: "CM", nationality: "Italy", nationality_flag: "IT", club: "PSG", league: "Ligue 1", overall: 84, stats: s(56, 58, 86, 86, 72, 60) },
  { name: "Carlos Soler", position: "CM", nationality: "Spain", nationality_flag: "ES", club: "PSG", league: "Ligue 1", overall: 79, stats: s(62, 72, 76, 76, 58, 64) },
  { name: "Seko Fofana", position: "CM", nationality: "Ivory Coast", nationality_flag: "CI", club: "Lens", league: "Ligue 1", overall: 81, stats: s(76, 70, 72, 78, 72, 82) },
  { name: "Mama Balde", position: "RW", nationality: "Guinea-Bissau", nationality_flag: "GW", club: "Troyes", league: "Ligue 1", overall: 72, stats: s(88, 66, 52, 76, 22, 60) },
  { name: "Gaetan Laborde", position: "ST", nationality: "France", nationality_flag: "FR", club: "Nice", league: "Ligue 1", overall: 76, stats: s(74, 76, 56, 72, 34, 76) },
  { name: "Andy Delort", position: "ST", nationality: "Algeria", nationality_flag: "DZ", club: "Nice", league: "Ligue 1", overall: 75, stats: s(68, 76, 56, 72, 32, 76) },
  { name: "Savanier Teji", position: "CM", nationality: "France", nationality_flag: "FR", club: "Montpellier", league: "Ligue 1", overall: 77, stats: s(54, 72, 80, 80, 50, 60) },
  { name: "Gelson Martins", position: "RW", nationality: "Portugal", nationality_flag: "PT", club: "Monaco", league: "Ligue 1", overall: 74, stats: s(86, 64, 58, 78, 26, 60) },
];

// ============================================================
// Combine all players
// ============================================================
const allPlayers = [
  ...superLig,
  ...premierLeague,
  ...serieA,
  ...bundesliga,
  ...ligue1,
  ...laLiga,
];

module.exports = { allPlayers, getTier, s };

// ============================================================
// SEED
// ============================================================
function seed() {
  initDatabase();
  const db = getDb();

  // Check if players already exist
  const count = db.prepare('SELECT COUNT(*) as cnt FROM players').get().cnt;
  if (count > 0) {
    console.log(`[seed] Players table already has ${count} rows. Skipping seed.`);
    process.exit(0);
  }

  console.log(`[seed] Inserting ${allPlayers.length} players...`);

  const stmt = db.prepare(
    'INSERT INTO players (name, position, nationality, nationality_flag, club, league, overall, tier, stats) VALUES (?,?,?,?,?,?,?,?,?)'
  );

  const insertAll = db.transaction((players) => {
    for (const p of players) {
      const tier = p.overall >= 91 ? 'elite' : p.overall >= 85 ? 'gold' : p.overall >= 71 ? 'silver' : 'bronze';
      stmt.run(
        p.name,
        p.position,
        p.nationality,
        p.nationality_flag,
        p.club,
        p.league,
        p.overall,
        tier,
        p.stats
      );
    }
  });

  insertAll(allPlayers);

  // Print summary
  const summary = db.prepare(
    "SELECT league, tier, COUNT(*) as cnt FROM players GROUP BY league, tier ORDER BY league, tier"
  ).all();

  console.log('\n=== SEED SUMMARY ===');
  let currentLeague = '';
  let leagueTotal = 0;
  for (const row of summary) {
    if (row.league !== currentLeague) {
      if (currentLeague) console.log(`  TOTAL: ${leagueTotal}`);
      currentLeague = row.league;
      leagueTotal = 0;
      console.log(`\n${row.league}:`);
    }
    console.log(`  ${row.tier}: ${row.cnt}`);
    leagueTotal += row.cnt;
  }
  if (currentLeague) console.log(`  TOTAL: ${leagueTotal}`);

  const totalCount = db.prepare('SELECT COUNT(*) as cnt FROM players').get().cnt;
  console.log(`\nTotal players inserted: ${totalCount}`);
  console.log('[seed] Done!');
}

if (require.main === module) {
  seed();
}
