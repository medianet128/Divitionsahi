document.addEventListener('DOMContentLoaded', function () {
    // Firebase കോൺഫിഗറേഷൻ
    const firebaseConfig = {
        apiKey: "AIzaSyASp-7LRoltYsJf3jP33ZhYrW69ioSyfwE",
        authDomain: "sahithyotsav-results.firebaseapp.com",
        projectId: "sahithyotsav-results",
        storageBucket: "sahithyotsav-results.firebasestorage.app",
        messagingSenderId: "108941873805",
        appId: "1:108941873805:web:76fb9d3b3b8f831b5648c4",
        databaseURL: "https://sahithyotsav-results-default-rtdb.asia-southeast1.firebasedatabase.app"
    };

    // Firebase Initialize ചെയ്യുക
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // HTML എലമെന്റുകൾ എടുക്കുക
    const landingPage = document.getElementById('landing-page');
    const getResultBtn = document.getElementById('get-result-btn');
    const chatContainer = document.getElementById('chat-container');
    const chatBox = document.getElementById('chat-box');
    const startBtn = document.getElementById('start-btn');
    
    let allResults = [];

    const urlParams = new URLSearchParams(window.location.search);
    const bgImageUrl = urlParams.get('bg');
    if (bgImageUrl) {
        landingPage.style.backgroundImage = `url(${bgImageUrl})`;
    }

    getResultBtn.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        typeMessage("Welcome to the Sahithyotsav Results Bot!");
    });

    startBtn.addEventListener('click', async () => {
        startBtn.style.display = 'none';
        await fetchResultsFromFirebase();
        displayCategories();
    });

    async function fetchResultsFromFirebase() {
        try {
            const snapshot = await db.ref("results").once("value");
            const data = snapshot.val();
            if (data) {
                allResults = Object.values(data); 
            } else {
                typeMessage("No results found in the database.");
            }
        } catch (error) {
            console.error("Error fetching results: ", error);
            typeMessage("Sorry, couldn't load results. Please try again later.");
        }
    }
    
    function displayCategories() {
        typeMessage("Please select a category to view results.");
        const categories = [...new Set(allResults.map(item => item.category))];
        const optionsHtml = categories.map(cat => `<button data-category="${cat}">${cat}</button>`).join('');
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        optionsContainer.innerHTML = optionsHtml;
        chatBox.appendChild(optionsContainer);

        optionsContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const selectedCategory = button.dataset.category;
                addUserMessage(selectedCategory);
                displayPrograms(selectedCategory);
            });
        });
    }

    function displayPrograms(category) {
        typeMessage(`Results for: ${category}<br>Please select a program:`);
        const programs = allResults.filter(item => item.category === category);
        const optionsHtml = programs.map(prog => `<button data-program="${prog.program}">${prog.program}</button>`).join('');
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        optionsContainer.innerHTML = optionsHtml;
        chatBox.appendChild(optionsContainer);
        
        optionsContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                const selectedProgram = button.dataset.program;
                addUserMessage(selectedProgram);
                displayResultImage(selectedProgram, category);
            });
        });
    }
    
    // ***പുതിയതായി ചേർത്ത ഫംഗ്ഷൻ***
    // Google Drive ലിങ്കിൽ നിന്ന് ഫയൽ ID വേർതിരിച്ച്, കാണാനും ഡൗൺലോഡ് ചെയ്യാനും വേണ്ടിയുള്ള ലിങ്കുകൾ ഉണ്ടാക്കുന്നു.
    function getDirectDriveUrl(driveUrl) {
        const regex = /file\/d\/([a-zA-Z0-9_-]+)/;
        const match = driveUrl.match(regex);
        if (match && match[1]) {
            const fileId = match[1];
            return {
                view: `https://drive.google.com/uc?export=view&id=${fileId}`,
                download: `https://drive.google.com/uc?export=download&id=${fileId}`
            };
        }
        // Google Drive ലിങ്ക് അല്ലെങ്കിൽ പഴയ ലിങ്ക് തന്നെ തിരികെ നൽകും
        return { view: driveUrl, download: driveUrl };
    }

    // ***മാറ്റം വരുത്തിയ ഫംഗ്ഷൻ***
    // റിസൾട്ട് ഇമേജ് കാണിക്കുക
    function displayResultImage(program, category) {
        const results = allResults.filter(item => item.category === category && item.program === program);
        if (results.length > 0) {
            results.forEach(result => {
                // ഡാറ്റാബേസിൽ നിന്നുള്ള ലിങ്കിനെ പുതിയ ഫംഗ്ഷൻ ഉപയോഗിച്ച് മാറ്റുന്നു
                const imageUrls = getDirectDriveUrl(result.resultImageUrl);

                const imgCard = document.createElement('div');
                imgCard.className = 'result-image-card';
                imgCard.innerHTML = `
                    <img src="${imageUrls.view}" alt="Result for ${program}">
                    <span class="download-icon" data-url="${imageUrls.download}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </span>
                `;
                chatBox.appendChild(imgCard);
                
                // ഡൗൺലോഡ് ഐക്കൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ
                imgCard.querySelector('.download-icon').addEventListener('click', (e) => {
                    // പുതിയ ഡൗൺലോഡ് രീതി ഉപയോഗിക്കുന്നു
                    downloadImage(e.currentTarget.dataset.url, `${program}_result.png`);
                });
            });
        } else {
            typeMessage("Sorry, result not found for this program.");
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function typeMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'bot-message';
        chatBox.appendChild(messageElement);
        let i = 0;
        const typing = setInterval(() => {
            if (i < text.length) {
                messageElement.innerHTML += text.charAt(i);
                i++;
                chatBox.scrollTop = chatBox.scrollHeight;
            } else {
                clearInterval(typing);
            }
        }, 20);
    }

    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ***മാറ്റം വരുത്തിയ ഫംഗ്ഷൻ***
    // ഇമേജ് ഡൗൺലോഡ് ചെയ്യാൻ
    function downloadImage(imageUrl, fileName) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = imageUrl;
        a.download = fileName; // ഫയലിന് ഒരു പേര്
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
