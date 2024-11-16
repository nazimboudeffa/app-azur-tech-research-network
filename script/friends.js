import { getUsersData } from "./dataAPI.js";
import { formatDate } from "./utils.js";

const friendList = document.querySelector(".friends__list");
const sortFilterOption = document.getElementById('sort-options');

const usersData = await getUsersData();
const allFriends = usersData.slice(1);

/**
 * Initialize drag-and-drop functionality for friend cards
 */
function initDrapAndDrop() {
    const friendCard = document.querySelectorAll(".friend__card");
    let draggedItem;
    let dragStartClientY;

    /** @type {HTMLAnchorElement[]} */
    friendCard.forEach(card => {
        // Start drag-and-drop
        card.addEventListener("dragstart", (event) => {
            draggedItem = card;
            event.dataTransfer.effectAllowed = "move";
            event.target.classList.add("dragging");
            dragStartClientY = event.clientY;
        });

        // End drag-and-drop
        card.addEventListener("dragend", () => {
            draggedItem = null;
            event.target.classList.remove("dragging");
        });

        // Management hover to place the card
        card.addEventListener("dragover", (event) => {
            event.preventDefault();
            const box = card.getBoundingClientRect();
            const offsetY = event.clientY - box.top - box.height / 2;

            if (card !== draggedItem) {
                // Card before or after the card hover
                if (offsetY < 0) {
                    card.parentNode.insertBefore(draggedItem, card);
                } else {
                    card.parentNode.insertBefore(draggedItem, card.nextSibling);
                }
            }
        });
    });
}

// Calls drag-and-drop initialization function
initDrapAndDrop();

/**
 * Sorts friends by specified property (first or lastName)
 * @param {"firstName" | "lastName" | "none"}  [property="none"] - Property to sort (“firstName”, “lastName”, “none”)
 * @returns {Array} - Sorted table of friends or complete list if no sorting is selected
 */
function sortFriendsBy(property = "none") {
    if (property === "none") {
        return [...allFriends];
    }
    
    return [...allFriends].sort(sortBy(property));

    /**
     * Comparaison function for sorting by property
     * @param {string} property - Sort property
     * @returns {function} - Comparaison function for Array.prototype.sort
     */
    function sortBy(property) {
        return function (person1, person2) {
            if (person1[property] > person2[property]) {
                return 1;
            }
            if (person1[property] < person2[property]) {
                return -1;
            }
            return 0;
        };
    }
}

/**
 * Generates HTML template to display sorted friends list
 * @param {Array.<Object>} sortedFriends - Sorted list of friends
 * @param {number} sortedFriends[].id - ID's user
 * @param {string} sortedFriends[].firstName - FirstName's user
 * @param {string} sortedFriends[].lastName - LastName's user
 * @param {string} sortedFriends[].profilePicture - Profile picture's user
 * @param {string} sortedFriends[].lastConnexion - Date of the connexion
 * @param {number} sortedFriends[].conversationId - ID's conversation with this user
 * @returns {string} - HTML friends list
 */
function friendListTemplate(sortedFriends) {
    return sortedFriends.map((friend) => 
        `<li class="friend__card" draggable="true">
            <img class="friend__move-icon" src="./assets/icons/drag-drop.svg" alt="Déplacer">
            <div class="friend__info">
                <div class="friend__profile">
                    <img src="assets/images/profiles/${friend.profilePicture}" alt="Profil de ${friend.firstName}" class="friend__profile-pic">
                    <p class="friend__profile-name">${friend.firstName} ${friend.lastName}</p>
                </div>
                <span class="friends__last-seen">Dernière connexion : il y a ${formatDate(friend.lastConnexion)}</span>
            </div>
            <a href="./messaging.html?id=${friend.conversationId}" class="friend__message"><img src="assets/icons/send.svg" alt="Envoyer un message"></a>
        </li>`
    ).join('');
}

// Listen to changes to sort friends
sortFilterOption.addEventListener('change', (event) => {
    const sortedFriends = sortFriendsBy(event.target.value);
    friendList.innerHTML = friendListTemplate(sortedFriends);
    initDrapAndDrop(); // Resets drag-and-drop for new sorted items
});