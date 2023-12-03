/**
 * Hayden Roberts
 * This file acts as the client side code that interacts with the server.
 */

// Function to add a user
function addUser() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const userData = {
    username: username,
    password: password,
  };

  fetch("/add/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.status === 201) {
        alert("User created!");
        console.log("User added successfully.");
      } else {
        console.error("Failed to add user.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function goToPost() {
  window.location.href = "post.html";
}

function goToHelp() {
  window.location.href = "help.html";
}

// Function to log in a user
function login() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const userData = {
    username: username,
    password: password,
  };

  fetch("/account/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.status === 200) {
        // Login successful, redirect to a new page or perform other actions.
        window.location.href = `/feed.html`;
      } else {
        // Login failed, display an error message.
        const loginError = document.getElementById("loginError");
        loginError.innerHTML = "Issue logging in with that info";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Function to log out a user
function logout() {
  fetch("/account/logout", {
    method: "POST",
    credentials: "include",
  })
    .then((response) => {
      if (response.status === 200) {
        window.location.href = "/index.html";
      } else {
        console.error("Logout failed");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// document.addEventListener("DOMContentLoaded", function () {
//   const searchPostsButton = document.querySelector("#searchPostsButton");
//   const resultsContainer = document.querySelector("#results");

//   // Function to handle displaying posts
//   function displayPosts(posts) {
//     resultsContainer.innerHTML = ""; // Clear previous results

//     if (posts.length === 0) {
//       resultsContainer.textContent = "";
//       return;
//     }

//     posts.forEach((listing) => {
//       const postCard = document.createElement("div");
//       postCard.classList.add("post-card");
//       postCard.id = `postCard-${listing._id}`;

//       const image = document.createElement("p");
//       image.textContent = listing.image;

//       const caption = document.createElement("p");
//       caption.textContent = listing.description;

//       postCard.appendChild(image);
//       postCard.appendChild(caption);
//       resultsContainer.appendChild(postCard);
//     });
//   }

//   // Function to search for posts
//   function searchPosts() {
//     const keyword = document.getElementById("searchPosts").value;

//     // Make a GET request to retrieve posts matching the keyword
//     fetch(`/search/posts/${keyword}`)
//       .then((response) => response.json())
//       .then((posts) => {
//         displayPosts(posts);
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//       });
//   }

//   // Function to view posts
//   function viewPosts() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const username = urlParams.get("username");

//     // Make a GET request to retrieve user posts
//     fetch(`/get/posts/${username}`)
//       .then((response) => response.json())
//       .then((posts) => {
//         console.log(posts);
//         const postIds = posts.map((listing) => listing);
//         console.log(postIds);
//         const postPromises = postIds.map((postId) => {
//           return fetch(`/get/post/${postId}`)
//             .then((response) => response.json())
//             .catch((error) => {
//               console.error("Error fetching post details:", error);
//               return null; // Handle fetch error gracefully
//             });
//         });

//         Promise.all(postPromises)
//           .then((posts) => {
//             const validposts = posts.filter((post) => post !== null);
//             displayPosts(validposts);
//           })
//           .catch((error) => {
//             console.error("Error:", error);
//           });
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//       });
//   }

//   if (window.location.href.includes("feed.html")) {
//     searchPostsButton.addEventListener("click", searchPosts);
//     viewPostsButton.addEventListener("click", viewPosts);

//     document
//       .getElementById("createPostButton")
//       .addEventListener("click", function () {
//         const urlParams = new URLSearchParams(window.location.search);
//         const username = urlParams.get("username");
//         window.location.href = "post.html?username=" + username;
//       });
//   }
// });

function goToPost() {
  window.location.href = "/post.html";
}

function goToFeed() {
  window.location.href = "/feed.html";
}

function goToAccount() {
  window.location.href = "/account.html";
}

function goToFeed() {
  window.location.href = "/feed.html";
}

function searchUsers() {
  const userInput = document.getElementById("sAccounts").value;
  var list = document.getElementById("list");

  fetch("/search/users/" + userInput)
    .then((response) => response.json())
    .then((users) => {
      list.innerHTML = "";
      users.forEach((user) => {
        console.log(user.username);
        const userElement = document.createElement("div");
        userElement.className = "listUsers";

        userElement.innerHTML = `
        <a href=account.html?username=${user.username}>${user.username}</a>`;
        list.appendChild(userElement);
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function addPost() {
  try {
    // Fetch the username from the server
    const response = await fetch("/get/usernameFromCookie");
    if (!response.ok) {
      throw new Error("Failed to fetch username.");
    }

    const username = await response.text();

    // Rest of the code remains the same
    const form = new FormData();
    const photoInput = document.getElementById("photo").files[0];
    const captionInput = document.getElementById("caption").value;

    form.append("photo", photoInput);
    form.append("caption", captionInput);
    form.append("username", username);

    fetch("/upload/post", {
      method: "POST",
      body: form,
    })
      .then((response) => {
        return response;
      })
      .then((data) => {
        console.log("CHECKPOINT DELTA");
        goToFeed();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(error.message);
      });
  } catch (error) {
    console.error("Error:", error);
    alert(error.message);
  }
}

function likePost(postId) {
  fetch(`/likePost/${postId}?timestamp=${new Date().getTime()}`, { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update the like count on the button
        const likeCountSpan = document.getElementById(`like_count_${postId}`);
        likeCountSpan.textContent = "❤ " + data.newLikeCount;
      }
    })
    .catch((error) => console.error("Error:", error));
}

async function getCurrentUsername() {
  // Fetch the username from the server
  const response = await fetch("/get/usernameFromCookie");
  const username = await response.text();
  return username;
}

async function showPosts() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  const loggedInUsername = await getCurrentUsername(); 
  var disp = document.getElementById('displayArea');

  fetch('/get/posts/' + username)
    .then((response) => response.json())
    .then((posts) => {
      disp.innerHTML = ''; // Clear previous posts

      if (posts.length === 0) {
        // If there are no posts, display a message
        const noPostsMessage = document.createElement('h1');
        noPostsMessage.textContent = "Upload posts to see them here!";
        noPostsMessage.style.color = "#808080";
        noPostsMessage.style.textAlign = "center";
        disp.appendChild(noPostsMessage);
      } else {
        // Display posts if there are any
        posts.forEach(post => {
          const postElement = document.createElement('div');
          postElement.className = 'post'; 
          postElement.id = `post_${post._id}`;

          let deleteButtonHTML = '';
        let editButtonHTML = '';

          if (loggedInUsername === post.user) {
            deleteButtonHTML = `<button style="font-size: 20px;" class="styled-button" onclick="deletePost('${post._id}')">Delete Post</button>`;
            editButtonHTML = `<button id="edit_button_${post._id}" onclick="editCaption('${post._id}')" class="styled-button" style="font-size: 20px;">Edit</button>`;
          }

          postElement.innerHTML = `
            <span><span style="color: gray";>@</span><a href="account.html?username=${username}" class="username" style="text-decoration: underline;">${post.user}</a></span>
            <div class="post-image">
              <img src="./${post.image}" alt="${post.caption}">
            </div>
            <hr>
            <div class="post-box">
            <div id="caption_${post._id}" class="post-caption">${post.caption}</div>
            <div class="post-content">
              <input type="text" id="edit_caption_${post._id}" class="edit-caption-input" style="display:none;" value="${post.caption}">
              ${editButtonHTML}
              <button style="font-size: 20px;" class="styled-button" onclick="likePost('${post._id}')"><span id="like_count_${post._id}">❤ ${post.likes != null ? post.likes : 0}</span></button>
              ${deleteButtonHTML}
            </div>
            </div>
          `;
          disp.appendChild(postElement);
        });
      }
    });
}

// DELETE POST
function deletePost(postId) {
  // Prompt the user for confirmation
  const confirmDelete = window.confirm("Are you sure you want to delete this post?");
  if (confirmDelete) {
    fetch(`/delete/post/${postId}`, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Remove the post client side
              document.getElementById(`post_${postId}`).remove();
          }
      })
      .catch(error => console.error('Error:', error));
  }
}

// TEST TEST TEST
function editCaption(postId) {
  const captionDiv = document.getElementById(`caption_${postId}`);
  const editCaptionInput = document.getElementById(`edit_caption_${postId}`);
  const editButton = document.querySelector(`#edit_button_${postId}`);
  const isEditing = editCaptionInput.style.display === 'none';

  if (isEditing) {
      // Switch to edit mode
      captionDiv.style.display = 'none';
      editCaptionInput.style.display = 'block';
      editButton.textContent = 'Save'; // Change button text to "Save"
  } else {
      // Confirm the edit
      const updatedCaption = editCaptionInput.value;
      captionDiv.textContent = updatedCaption;
      captionDiv.style.display = 'block';
      editCaptionInput.style.display = 'none';
      editButton.textContent = 'Edit'; // Change button text back to "Edit"

      fetch(`/update/post/${postId}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ caption: updatedCaption })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              console.log('Caption updated successfully');
          } else {
              console.error('Failed to update caption');
          }
      })
      .catch(error => console.error('Error:', error));
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Check if the current page is account.html
  if (
    window.location.pathname.endsWith("/account.html") ||
    window.location.pathname.endsWith("account.html")
  ) {
    showPosts();
  }
});
