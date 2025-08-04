const pokemonDisplay = document.getElementById('pokemon-display');
const nameEl = document.getElementById('pokemon-name');
const typeEl = document.getElementById('pokemon-type');
const idEl = document.getElementById('pokemon-id');
const heightEl = document.getElementById('pokemon-height');
const weightEl = document.getElementById('pokemon-weight');
const abilitiesEl = document.getElementById('pokemon-abilities');
const baseStatsEl = document.getElementById('pokemon-base-stats');
const toggleThemeBtn = document.getElementById('toggle-theme');

let currentId = 1;

// ============================
// Função principal: buscar Pokémon
// ============================
async function fetchPokemon(idOrName) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();

    // Criar imagem
    const img = document.createElement('img');
    img.src = data.sprites.other['official-artwork'].front_default;
    img.alt = data.name;
    img.classList.add('pokemon-image');

    // Limpar e inserir imagem
    pokemonDisplay.innerHTML = '';
    pokemonDisplay.appendChild(img);

    // Dados principais
    nameEl.textContent = capitalize(data.name);
    typeEl.textContent = 'Tipo: ' + data.types.map(t => capitalize(t.type.name)).join(', ');

    // Trocar classe de tipo
    pokemonDisplay.className = 'pokemon-info';
    const primaryType = data.types[0].type.name;
    pokemonDisplay.classList.add(`type-${primaryType}`);

    // ID, altura, peso
    idEl.textContent = `#${String(data.id).padStart(3, '0')}`;
    heightEl.textContent = `Altura: ${data.height / 10} m`;
    weightEl.textContent = `Peso: ${data.weight / 10} kg`;

    // Habilidades
    const abilities = data.abilities.map(a => capitalize(a.ability.name)).join(', ');
    abilitiesEl.textContent = `Habilidades: ${abilities}`;

    // Estatísticas
    baseStatsEl.innerHTML = '';
    data.stats.forEach(stat => {
      const p = document.createElement('p');
      p.textContent = `${translateStat(stat.stat.name)}: ${stat.base_stat}`;
      baseStatsEl.appendChild(p);
    });

  } catch (error) {
    console.error('Erro ao buscar o Pokémon:', error);
    pokemonDisplay.innerHTML = '<p style="color: red;">Erro ao carregar</p>';
  }
}

// ============================
// Utilitários
// ============================
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function translateStat(statName) {
  const map = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'Ataque Esp.',
    'special-defense': 'Defesa Esp.',
    speed: 'Velocidade'
  };
  return map[statName] || statName;
}

// ============================
// Navegação entre pokémons
// ============================
document.getElementById('next-btn').addEventListener('click', () => {
  currentId++;
  fetchPokemon(currentId);
});

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentId > 1) {
    currentId--;
    fetchPokemon(currentId);
  }
});

// ============================
// Alternância de tema
// ============================
if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
}

// ============================
// Busca com autocomplete + Enter
// ============================
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
let allPokemonNames = [];

async function fetchAllPokemonNames() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await response.json();
    allPokemonNames = data.results.map(p => p.name);
  } catch (error) {
    console.error('Erro ao buscar nomes de Pokémon:', error);
  }
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  suggestionsList.innerHTML = '';

  if (query === '') return;

  const filtered = allPokemonNames.filter(name => name.startsWith(query)).slice(0, 10);
  filtered.forEach(name => {
    const li = document.createElement('li');
    li.textContent = capitalize(name);
    li.addEventListener('click', () => {
      fetchPokemon(name);
      searchInput.value = '';
      suggestionsList.innerHTML = '';
    });
    suggestionsList.appendChild(li);
  });
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.toLowerCase().trim();
    if (query !== '') {
      fetchPokemon(query);
      searchInput.value = '';
      suggestionsList.innerHTML = '';
    }
  }
});

fetchAllPokemonNames();
fetchPokemon(currentId);
// ============================
// Botão "Ver Evolução"
// ============================
// ============================
// Botão "Ver Evolução"
// ============================
const evolutionBtn = document.getElementById('evolution-btn');

if (evolutionBtn) {
  evolutionBtn.addEventListener('click', () => {
    const pokemonName = nameEl.textContent.toLowerCase();
    if (pokemonName) {
      const repoBase = '/pokedexretrowave'; // Nome do seu repositório
      const url = `${repoBase}/evolucoes.html?pokemon=${encodeURIComponent(pokemonName)}`;
      window.location.href = url;
    }
  });
}

// ============================
// Carregar Pokémon da URL (quando vindo da tela de Evoluções)
// ============================
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const pokemonParam = params.get('pokemon');

  if (pokemonParam) {
    fetchPokemon(pokemonParam.toLowerCase());
  }
});
