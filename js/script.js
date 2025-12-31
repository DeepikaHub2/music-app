console.log("Let's write JavaScript");

let currentSong = new Audio();
let songs;
let currFolder;

// Fixed missing element references
const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const volumeSlider = document.querySelector(".range input");
const muteBtn = document.querySelector(".volume img");

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let res = await fetch(`http://127.0.0.1:5501/${folder}/`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let as = div.getElementsByTagName("a");
  songs = [];

  for (let a of as) {
    if (a.href.endsWith(".m4a") || a.href.endsWith(".weba")) {
      songs.push(a.href.split(`/${folder}/`)[1]);
    }
  }

  let ul = document.querySelector(".songList ul");
  ul.innerHTML = "";
  for (let song of songs) {
    ul.innerHTML += `<li>
        <img class="invert" src="img/music.svg" alt="">
        <div class="info"><div>${song
          .replaceAll("%20", " ")
          .replace(/\.(m4a|weba)$/i, "")}</div></div>

        <div class="playnow"><span>Play Now</span><img class="invert" src="img/play.svg" alt=""></div>
    </li>`;
  }

  Array.from(document.querySelectorAll(".songList li")).forEach((li) => {
    li.addEventListener("click", () => {
      playMusic(li.querySelector(".info div").innerText.trim());
    });
  });
  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) currentSong.play();
  play.src = currentSong.paused ? "img/play.svg" : "img/pause.svg";
  const displayName = decodeURI(track).replace(/\.(m4a|mp3|wav|weba)$/i, "");
  document.querySelector(".songinfo").innerText = displayName;
  document.querySelector(".songtime").innerText = "00:00 / 00:00";
};

async function displayAlbums() {
  let res = await fetch(`http://127.0.0.1:5501/songs/`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");
  let container = document.querySelector(".cardContainer");

  for (let e of anchors) {
    if (e.href.includes("/songs/")) {
      let folder = e.href.split("/").slice(-1)[0];
      let meta = await fetch(`http://127.0.0.1:5501/songs/${folder}/info.json`);
      let info = await meta.json();
      container.innerHTML += `<div data-folder="${folder}" class="card">
          <div class="play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
          </div>
          <img src="/songs/${folder}/cover.jpeg" alt="">
          <h2>${info.title}</h2>
          <p>${info.description}</p>
      </div>`;
    }
  }

  Array.from(document.querySelectorAll(".card")).forEach((card) => {
    card.addEventListener("click", async () => {
      await getSongs(`songs/${card.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  await getSongs("songs/ncs");
  playMusic(songs[0], true);
  displayAlbums();

  play.addEventListener("click", () => {
    if (currentSong.paused) currentSong.play();
    else currentSong.pause();
    play.src = currentSong.paused ? "img/play.svg" : "img/pause.svg";
  });

  previous.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index > 0) playMusic(songs[index - 1]);
  });

  next.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index < songs.length - 1) playMusic(songs[index + 1]);
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let rect = e.target.getBoundingClientRect();
    let percent = e.offsetX / rect.width;
    currentSong.currentTime = currentSong.duration * percent;
    document.querySelector(".circle").style.left = percent * 100 + "%";
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  volumeSlider.addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
  });

  muteBtn.addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      volumeSlider.value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      volumeSlider.value = 10;
    }
  });
}

main();
