const apiKey = 'c7e5670d3f354c248b8e9b402d9149e0';
const gamesPerPage = 50;
const maxPages = 30;
let allGames = [];

async function fetchGames(page = 1) {
  try {
    const response = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&page=${page}&page_size=${gamesPerPage}`);
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

async function populateGameDropdowns() {
  for (let page = 1; page <= maxPages; page++) {
    const pageGames = await fetchGames(page);
    allGames.push(...pageGames);
  }

  const gameSelects = [document.getElementById('game1'), document.getElementById('game2'), document.getElementById('game3')];

  gameSelects.forEach(select => {
    allGames.forEach(game => {
      const option = document.createElement('option');
      option.value = game.id;
      option.textContent = game.name;
      select.appendChild(option);
    });
  });
}

populateGameDropdowns();

document.getElementById('game-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const selectedGameIds = [
    document.getElementById('game1').value,
    document.getElementById('game2').value,
    document.getElementById('game3').value,
  ];
  getRecommendations(selectedGameIds);
});

function calculateSimilarity(game1, game2) {
  const genreSimilarity = game1.genres.filter(g1 => 
    game2.genres.some(g2 => g1.id === g2.id)
  ).length / Math.max(game1.genres.length, game2.genres.length);

  const ratingDifference = Math.abs(game1.rating - game2.rating) / 5; // Assuming max rating is 5
  
  return (genreSimilarity * 0.7) + ((1 - ratingDifference) * 0.3); // Weighted similarity
}

function getRecommendations(selectedGameIds) {
  const selectedGames = allGames.filter(game => selectedGameIds.includes(game.id.toString()));
  
  const recommendations = allGames
    .filter(game => !selectedGameIds.includes(game.id.toString()))
    .map(game => {
      const averageSimilarity = selectedGames.reduce((sum, selectedGame) => 
        sum + calculateSimilarity(game, selectedGame), 0) / selectedGames.length;
      return { ...game, similarity: averageSimilarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10); // Ensure we only take the top 10 recommendations

  displayRecommendations(recommendations);
}

function displayRecommendations(recommendations) {
  const list = document.getElementById('recommendation-list');
  list.innerHTML = '';

  recommendations.forEach(game => {
    const li = document.createElement('li');
    li.textContent = `${game.name} (Genres: ${game.genres.map(g => g.name).join(', ')}, Rating: ${game.rating.toFixed(1)})`;
    list.appendChild(li);
  });

  // If less than 10 recommendations, add placeholder items
  for (let i = recommendations.length; i < 10; i++) {
    const li = document.createElement('li');
    li.textContent = 'No additional recommendation available';
    list.appendChild(li);
  }
}
