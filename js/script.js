console.log("JavaScript Loaded");

let currentSong = new Audio();
let songs = [];
let currFolder = "";
// for left and right button in nav bar
let albumFolders = [];
let currentAlbumIndex = 0;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/video84_js/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "images/pause.svg";
    } else {
        play.src = "images/play.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function getSongs(folder) {
    currFolder = folder;
    let res = await fetch(`/video84_js/${folder}/`);
    let html = await res.text();

    let div = document.createElement("div");
    div.innerHTML = html;

    let anchors = div.getElementsByTagName("a");
    songs = [];

    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            songs.push(a.href.split(`/${folder}/`)[1]);
        }
    }

    // Populate song list
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    if (songs.length === 0) {
        // Show 'Empty Folder' if no songs found
        songUL.innerHTML = `<li style="text-align:center; padding: 1rem; color: gray;">
        🚫 Empty Folder!
    </li>`;
        return [];  // Return empty song list
    }

    for (let song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" width="34" src="images/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Kajal</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="images/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(songUL.children).forEach(li => {
        li.addEventListener("click", () => {
            const track = li.querySelector(".info div").innerText.trim();
            playMusic(track);
        });
    });

    return songs;
}

async function displayAlbums() {
    let res = await fetch("/video84_js/songs/");
    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;


    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    albumFolders = [];
    for (let a of anchors) {
        if (a.href.includes("/songs/") && !a.href.includes(".htaccess")) {
            let folder = a.href.split("/").slice(-2)[0];

            albumFolders.push(`songs/${folder}`);
            try {
                let meta = await fetch(`/video84_js/songs/${folder}/info.json`);
                let info = await meta.json();

                cardContainer.innerHTML += `
                <div data-folder="songs/${folder}" class="card">
                    <div class="play">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/video84_js/songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
            } catch (err) {
                console.warn(`Missing info.json for ${folder}`);
            }
        }
    }

    // document.querySelectorAll(".card").forEach(card => {
    //     card.addEventListener("click", async () => {
    //         let folder = card.dataset.folder;
    //         songs = await getSongs(folder);
    //         playMusic(songs[0], true);  // First song selected but not played
    //     });
    // });

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            currentAlbumIndex = albumFolders.indexOf(folder);

            // Get current song source (e.g., /video84_js/songs/ncs/song.mp3)
            const currentSrc = decodeURIComponent(currentSong.src);

            // Check if this folder contains the currently playing song
            const isCurrentFolder = currentSrc.includes(folder + "/");

            // Update the song list visually, but DO NOT auto-select or play any song
            const newSongs = await getSongs(folder);

            // Only replace the global `songs` array if we're not in the middle of playing a song from another folder
            if (!isCurrentFolder) {
                songs = newSongs;
            }

            // Do NOT call playMusic — so current song keeps playing!
        });

    });
}

async function main() {
    // await getSongs("songs/ncs");
    songs = await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await displayAlbums();



    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "images/pause.svg";
        } else {
            currentSong.pause();
            play.src = "images/play.svg";
        }
    });

    // currentSong.addEventListener("timeupdate", () => {
    //     document.querySelector(".songtime").innerHTML =
    //         `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    //     document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    // });

    currentSong.addEventListener("timeupdate", () => {
        let current = currentSong.currentTime;
        let duration = currentSong.duration;

        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(current)} / ${secondsToMinutesSeconds(duration)}`;

        let percent = (current / duration) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        document.querySelector(".progress-bar").style.width = `${percent}%`;
    });

    // document.querySelector(".seekbar").addEventListener("click", e => {
    //     let percent = (e.offsetX / e.target.getBoundingClientRect().width);
    //     currentSong.currentTime = currentSong.duration * percent;

    //     document.querySelector(".circle").style.left = `${percent}%`;
    //     document.querySelector(".progress-bar").style.width = `${percent}%`;
    // });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let seekbar = e.currentTarget;
        let rect = seekbar.getBoundingClientRect();
        let clickX = e.clientX - rect.left;

        let percent = Math.max(0, Math.min(1, clickX / rect.width)); // Clamp 0-1
        currentSong.currentTime = percent * currentSong.duration;

        let percentText = `${percent * 100}%`;
        document.querySelector(".circle").style.left = percentText;
        document.querySelector(".progress-bar").style.width = percentText;
    });




    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });


    previous.addEventListener("click", () => {
        let idx = songs.indexOf(currentSong.src.split("/").pop());
        if (idx > 0) {
            playMusic(songs[idx - 1]);
        } else {
            playMusic(songs[songs.length - 1]);
        }
    });

    next.addEventListener("click", () => {
        let idx = songs.indexOf(currentSong.src.split("/").pop());
        if (idx !== -1 && idx < songs.length - 1) {
            playMusic(songs[idx + 1]);
        }
        else {
            playMusic(songs[0]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = "images/volume.svg";
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("images/volume.svg")) {
            e.target.src = "images/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "images/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });

    document.querySelector(".home ul li:first-child").addEventListener("click", async () => {
        // Load default folder (ncs) without stopping current song
        // const folder = "songs/ncs";

        const currentSrc = decodeURIComponent(currentSong.src);
        const isCurrentFolder = currentSrc.includes(folder + "/");

        const newSongs = await getSongs(folder);
        if (!isCurrentFolder) {
            songs = newSongs;
            // Do NOT call playMusic — let it keep playing current song
        }
    });

    // for left and right button in nav bar
    document.querySelector(".leftbtn")
        .addEventListener("click", async () => {
            if (currentAlbumIndex > 0) {
                currentAlbumIndex--;
                let folder = albumFolders[currentAlbumIndex];

                const currentSrc = decodeURIComponent(currentSong.src);
                const isCurrentFolder = currentSrc.includes(folder + "/");

                const newSongs = await getSongs(folder);
                if (!isCurrentFolder) songs = newSongs;
            }
        });

    document.querySelector(".rightbtn")
        .addEventListener("click", async () => {
            if (currentAlbumIndex < albumFolders.length - 1) {
                currentAlbumIndex++;
                let folder = albumFolders[currentAlbumIndex];

                const currentSrc = decodeURIComponent(currentSong.src);
                const isCurrentFolder = currentSrc.includes(folder + "/");

                const newSongs = await getSongs(folder);
                if (!isCurrentFolder) songs = newSongs;
            }
        });
}

main();