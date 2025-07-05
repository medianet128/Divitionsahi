document.addEventListener('DOMContentLoaded', function () {
    // Firebase കോൺഫിഗറേഷൻ
    const firebaseConfig = {
        apiKey: "AIzaSyASp-7LRoltYsJf3jP33ZhYrW69ioSyfwE",
        authDomain: "sahithyotsav-results.firebaseapp.com",
        projectId: "sahithyotsav-results",
        storageBucket: "sahithyotsav-results.firebasestorage.app",
        messagingSenderId: "108941873805",
        appId: "YOUR_APP_ID",
        databaseURL: "1:108941873805:web:76fb9d3b3b8f831b5648c4" // Firestore അല്ല, Realtime Database URL
    };

    // Firebase Initialize ചെയ്യുക
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // HTML എലമെന്റുകൾ എടുക്കുക
    const landingPage = document.getElementById('landing-page');
    const getResultBtn = document.getElementById('get-result-btn');
    const chatContainer = document.getElementById('chat-container');
    const chatBox = document.getElementById('chat-box');
    const startBtn = document.getElementById('start-btn');
    
    let allResults = []; // എല്ലാ റിസൾട്ടുകളും ഇവിടെ സൂക്ഷിക്കും

    // URL-ൽ നിന്ന് ബാക്ക്ഗ്രൗണ്ട് ഇമേജ് സെറ്റ് ചെയ്യുക
    const urlParams = new URLSearchParams(window.location.search);
    const bgImageUrl = urlParams.get('bg');
    if (bgImageUrl) {
        landingPage.style.backgroundImage = `url(${bgImageUrl})`;
    }

    // "Get Result" ബട്ടൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ
    getResultBtn.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        typeMessage("Welcome to the Sahithyotsav Results Bot!");
    });

    // "Start" ബട്ടൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ
    startBtn.addEventListener('click', async () => {
        startBtn.style.display = 'none'; // സ്റ്റാർട്ട് ബട്ടൺ മറയ്ക്കുക
        await fetchResultsFromFirebase();
        displayCategories();
    });

    // Firebase-ൽ നിന്ന് ഡാറ്റ എടുക്കുക
    async function fetchResultsFromFirebase() {
        try {
            const snapshot = await db.collection("results").get(); // Google Script-ൽ സെറ്റ് ചെയ്ത collection name
            snapshot.forEach(doc => {
                allResults.push(doc.data());
            });
        } catch (error) {
            console.error("Error fetching results: ", error);
            typeMessage("Sorry, couldn't load results. Please try again later.");
        }
    }
    
    // കാറ്റഗറികൾ കാണിക്കുക
    function displayCategories() {
        typeMessage("Please select a category to view results.");
        const categories = [...new Set(allResults.map(item => item.category))]; // ഡ്യൂപ്ലിക്കേറ്റ് ഒഴിവാക്കാൻ

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

    // പ്രോഗ്രാമുകൾ കാണിക്കുക
    function displayPrograms(category) {
        typeMessage(`Results for: ${category}. <br>Please select a program:`);
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

    // റിസൾട്ട് ഇമേജ് കാണിക്കുക
    function displayResultImage(program, category) {
        const results = allResults.filter(item => item.category === category && item.program === program);
        if (results.length > 0) {
            results.forEach(result => {
                const imgCard = document.createElement('div');
                imgCard.className = 'result-image-card';
                imgCard.innerHTML = `
                    <img src="${result.resultImageUrl}" alt="Result for ${program}">
                    <span class="download-icon" data-url="${result.resultImageUrl}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </span>
                `;
                chatBox.appendChild(imgCard);
                // ഡൗൺലോഡ് ഐക്കൺ ക്ലിക്ക് ചെയ്യുമ്പോൾ
                imgCard.querySelector('.download-icon').addEventListener('click', (e) => {
                    downloadImage(e.currentTarget.dataset.url);
                });
            });
        } else {
            typeMessage("Sorry, result not found for this program.");
        }
        chatBox.scrollTop = chatBox.scrollHeight; // ഓട്ടോമാറ്റിക് സ്ക്രോൾ
    }

    // ടൈപ്പിംഗ് എഫക്റ്റോടെ മെസ്സേജ് കാണിക്കാൻ
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
        }, 20); // ടൈപ്പിംഗ് സ്പീഡ്
    }

    // യൂസർ അയച്ച മെസ്സേജ് കാണിക്കാൻ
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'user-message';
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ഇമേജ് ഡൗൺലോഡ് ചെയ്യാൻ
    async function downloadImage(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'result.png'; // ഫയലിന് ഒരു പേര്
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Could not download the image.');
        }
    }
});