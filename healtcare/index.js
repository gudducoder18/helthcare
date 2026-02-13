const volunteerForm = document.getElementById('volunteerForm');
const chatbotContainer = document.getElementById('chatbotContainer');
const floatingChatBtn = document.getElementById('floatingChatBtn');
const openChatbotBtn = document.getElementById('openChatbot');
const closeChatbotBtn = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('sendBtn');
const quickReplies = document.getElementById('quickReplies');

let conversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    volunteerForm.addEventListener('submit', handleFormSubmit);
    floatingChatBtn.addEventListener('click', toggleChatbot);
    openChatbotBtn.addEventListener('click', toggleChatbot);
    closeChatbotBtn.addEventListener('click', toggleChatbot);
    sendBtn.addEventListener('click', handleSendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            sendMessage(query);
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(volunteerForm);
    const data = Object.fromEntries(formData);
    const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(cb => cb.value);
    data.availability = availability;

    showNotification('Application submitted successfully! We will contact you soon.', 'success');
    console.log('Form Data:', data);
    volunteerForm.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 2rem; right: 2rem;
        background: ${type === 'success' ? '#4CAF50' : '#E74C3C'};
        color: white; padding: 1rem 1.5rem; border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleChatbot() {
    chatbotContainer.classList.toggle('active');
    if (chatbotContainer.classList.contains('active')) {
        chatbotInput.focus();
    }
}

function handleSendMessage() {
    const message = chatbotInput.value.trim();
    if (message) {
        sendMessage(message);
        chatbotInput.value = '';
    }
}

function sendMessage(message) {
    addMessageToChat(message, 'user');
    conversationHistory.push({ role: 'user', content: message });
    showTypingIndicator();
    getAIResponse(message);
    if (quickReplies.children.length > 0) {
        quickReplies.style.display = 'none';
    }
}

function addMessageToChat(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'bot'
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M8 10C8 10 10 8 12 8C14 8 16 10 16 10M8 14C8 14 10 12 12 12C14 12 16 14 16 14"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const formattedContent = formatMessageContent(content);
    contentDiv.innerHTML = formattedContent;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function formatMessageContent(content) {
    let formatted = content.replace(/\n/g, '<br>');
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>(?:<br>)?)+/g, '<ul>$&</ul>');
    formatted = formatted.replace(/(<ul>.*?)<br>/g, '$1');
    return formatted;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-message';
    typingDiv.id = 'typing-indicator';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M8 10C8 10 10 8 12 8C14 8 16 10 16 10M8 14C8 14 10 12 12 12C14 12 16 14 16 14"/></svg>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;

    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) typingIndicator.remove();
}

async function getAIResponse(userMessage) {
    try {
        const systemPrompt = `You are a helpful AI healthcare assistant for "HealthCare Connect", an NGO providing healthcare support to underserved communities. Answer questions about volunteer opportunities, healthcare services, and provide general health guidance. Be warm, compassionate, and concise.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{ role: 'user', content: systemPrompt + '\n\nUser query: ' + userMessage }]
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        removeTypingIndicator();

        const assistantMessage = data.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
        addMessageToChat(assistantMessage, 'bot');
        conversationHistory.push({ role: 'assistant', content: assistantMessage });

    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        const fallbackResponse = getFallbackResponse(userMessage);
        addMessageToChat(fallbackResponse, 'bot');
    }
}

function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('volunteer') || lowerMessage.includes('join')) {
        return `Thank you for your interest in volunteering! Here's how you can join:\n\n1. Fill out the volunteer registration form on this page\n2. Select your healthcare skills and availability\n3. Our team will review your application within 2-3 business days\n4. You'll receive an email with next steps and orientation details\n\nWe welcome volunteers with various backgrounds including nursing, medical practice, counseling, first aid, and administrative support!`;
    }

    if (lowerMessage.includes('service') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
        return `HealthCare Connect provides:\n\n- Free health checkups and screenings\n- Mental health counseling\n- Nutrition and dietary guidance\n- Emergency medical support\n- Health education programs\n- Medicine distribution in underserved areas\n\nTo access our services, contact us through this form or call our support line. For emergencies, dial 102.`;
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
        return `For medical emergencies:\n\n🚨 Call 102 immediately\n🏥 Visit the nearest hospital emergency room\n\nOur AI assistant provides general guidance, but for urgent medical situations, always seek immediate professional care.\n\nHow else can I help you?`;
    }

    return `I'm here to help with:\n\n- Volunteer opportunities\n- Healthcare services details\n- Support access guidance\n- General NGO questions\n\nHow can I assist you today?`;
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);