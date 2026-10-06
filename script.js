function loadMunicipalities() {
    var district = document.getElementById("district").value;
    var municipalitySelect = document.getElementById("municipality");
    var zipcodeInput = document.getElementById("zipcode");

    // Reset fields
    municipalitySelect.innerHTML = '<option value="">Select Municipality</option>';
    zipcodeInput.value = "";

    // Municipalities grouped by updated districts with official ZIP codes
    var data = {
        "District 1": {
            "Ilagan": "3300",
            "Cabagan": "3328",
            "Delfin Albano": "3326",
            "Divilacan": "3335",
            "Maconacon": "3333",
            "Tumauini": "3325",
            "San Pablo": "3329",
            "Santa Maria": "3330",
            "Santo Tomas": "3327"
        },
        "District 2": {
            "Benito Soliven": "3331",
            "Palanan": "3334",
            "Naguilian": "3302",
            "Reina Mercedes": "3303",
            "San Mariano": "3332",
            "Gamu": "3301"
        },
        "District 3": {
            "Alicia": "3306",
            "Cabatuan": "3315",
            "San Mateo": "3318",
            "Ramon": "3319",
            "Angadanan": "3307"
        },
        "District 4": {
            "Santiago": "3311",
            "Cordon": "3312",
            "Dinapigui": "3336",
            "San Agustin": "3314",
            "Jones": "3313"
        },
        "District 5": {
            "Aurora": "3316",
            "Burgos": "3322",
            "Luna": "3304",
            "Mallig": "3323",
            "Quezon": "3324",
            "Quirino": "3321",
            "Roxas": "3320",
            "San Manuel": "3312"
        },
        "District 6": {
            "Cauayan": "3305",
            "Echague": "3309",
            "San Guillermo": "3308",
            "San Isidro": "3310"
        }
    };

    // Populate municipalities
    if (data[district]) {
        Object.keys(data[district]).forEach(function(muni) {
            var option = document.createElement("option");
            option.value = muni;
            option.text = muni;
            municipalitySelect.appendChild(option);
        });

        // Auto-set ZIP when municipality selected
        municipalitySelect.onchange = function() {
            zipcodeInput.value = data[district][this.value] || "";
        };
    }
}

// Password validation
function valid() {
    if (document.signup.password.value != document.signup.confirmpassword.value) {
        alert("Password and Confirm Password do not match!");
        document.signup.confirmpassword.focus();
        return false;
    }
    return true;
}

// user_register.js

// Function to check password strength
function checkPasswordStrength(password) {
    let strength = 0;

    // Rules
    if (password.length >= 8) strength++; // Minimum length
    if (/[A-Z]/.test(password)) strength++; // At least one uppercase
    if (/[a-z]/.test(password)) strength++; // At least one lowercase
    if (/[0-9]/.test(password)) strength++; // At least one number
    if (/[\W]/.test(password)) strength++; // At least one special character

    return strength;
}

// Show feedback when user types password
document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.querySelector("#password"); // adjust if your input has a different ID
    const strengthText = document.createElement("small");
    strengthText.style.color = "red";
    passwordInput.parentNode.appendChild(strengthText);

    passwordInput.addEventListener("input", () => {
        const strength = checkPasswordStrength(passwordInput.value);

        if (strength <= 2) {
            strengthText.textContent = "Weak password ❌ (use 8+ chars, mix upper/lower, numbers, symbols)";
            strengthText.style.color = "red";
        } else if (strength === 3 || strength === 4) {
            strengthText.textContent = "Medium password ⚠️ (make it stronger)";
            strengthText.style.color = "orange";
        } else {
            strengthText.textContent = "Strong password ✅";
            strengthText.style.color = "green";
        }
    });
});
