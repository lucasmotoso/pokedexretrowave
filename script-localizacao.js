document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("theme-toggle");
  const body = document.body;
  const searchInput = document.getElementById("searchInput");
  const suggestionsBox = document.getElementById("suggestions");
  const content = document.getElementById("mapa-conteudo");
  const hamburger = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("pokedex-nav");

  let pokemonList = [];

  // Fetch lista completa de Pokémon para autocomplete
  async function fetchAllPokemonNames() {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10000");
      const data = await response.json();
      pokemonList = data.results.map(p => p.name);
    } catch (err) {
      console.error("Erro ao buscar lista de Pokémon:", err);
    }
  }

  fetchAllPokemonNames();

  // Autocomplete ao digitar
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    suggestionsBox.innerHTML = "";

    if (value.length > 1) {
      const filtered = pokemonList.filter(name => name.includes(value)).slice(0, 10);
      filtered.forEach(name => {
        const item = document.createElement("div");
        item.classList.add("suggestion-item");
        item.textContent = capitalize(name);
        item.addEventListener("click", () => {
          searchInput.value = capitalize(name);
          suggestionsBox.innerHTML = "";
          fetchAndRenderLocation(name);
        });
        suggestionsBox.appendChild(item);
      });
    }
  });

  // Enter na barra de pesquisa
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const pokemon = searchInput.value.trim().toLowerCase();
      if (pokemon) {
        fetchAndRenderLocation(pokemon);
        suggestionsBox.innerHTML = "";
      }
    }
  });

  // Toggle tema escuro/claro
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      body.style.backgroundImage = body.classList.contains("dark-mode")
        ? "url('imagens/background2.png')"
        : "url('imagens/background1.png')";
    });
  }

  // Hamburger menu
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("show");
    });
  }

  // Buscar localizações do Pokémon
  async function fetchAndRenderLocation(pokemonName) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}/encounters`);
      if (!response.ok) throw new Error("Pokémon não encontrado");

      const locations = await response.json();
      content.innerHTML = "";

      if (locations.length === 0) {
        content.innerHTML = "<p>Este Pokémon não foi encontrado em localizações conhecidas.</p>";
        return;
      }

      for (const location of locations) {
        const card = document.createElement("div");
        card.className = "local-card";
        const locName = formatLocationName(location.location_area.name);
        const versions = location.version_details.map(v => capitalize(v.version.name)).join(", ");

        card.innerHTML = `
          <h3>${locName}</h3>
          <p><strong>Versões:</strong> ${versions}</p>
          <div class="other-pokemon">Carregando outros Pokémon dessa área...</div>
        `;

        card.addEventListener("click", () => {
          fetchOtherPokemonFromLocation(location.location_area.url, card.querySelector(".other-pokemon"));
        });

        content.appendChild(card);
      }

    } catch (err) {
      content.innerHTML = `<p class="error">${err.message}</p>`;
    }
  }

  // Buscar outros Pokémon de uma localização
  async function fetchOtherPokemonFromLocation(url, container) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      const pokemonList = data.pokemon_encounters.map(p => p.pokemon.name);

      if (pokemonList.length === 0) {
        container.innerHTML = "Nenhum outro Pokémon nesta área.";
        return;
      }

      container.innerHTML = `<strong>Outros Pokémon encontrados:</strong><br>` +
        pokemonList.map(name => `<span class="pokemon-link" data-name="${name}">${capitalize(name)}</span>`).join(", ");
    } catch (err) {
      container.innerHTML = "Erro ao carregar outros Pokémon.";
    }
  }

 // Redirecionar para a pokedex.html mesmo no GitHub Pages
content.addEventListener("click", (e) => {
  if (e.target.classList.contains("pokemon-link")) {
    const name = e.target.dataset.name;
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
    window.location.href = `${basePath}/index.html?pokemon=${name}`;
  }
});


  // Helpers
  function formatLocationName(name) {
    return name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
