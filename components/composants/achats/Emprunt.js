// Emprunt.js
import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserContext } from './UserContext'; // Adjust the import according to your project structure
import { db } from './firebase'; // Adjust the import according to your project structure

const CadreEmprunt = ({ cathegorie, desc, exemplaire, image, name, matricule, cathegorie2, nomBD, dateHeure }) => {
    const date = new Date(dateHeure.seconds * 1000);
    const forma = date.toLocaleString();
    const format = date.toJSON(10);
    const formatDate = date.toDateString();
    const formatHeure = date.toTimeString();

    const [currentUser, setCurrentUser] = useState("eben1@gmail.com");
    const { currentUserNewNav } = useContext(UserContext);
    const [dat, setDat] = useState(0);

    const subscriber = () => {
        const docRef = doc(db, 'BiblioUser', currentUserNewNav.email);
        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setDat(data);
            }
        });
    };

    useEffect(() => {
        subscriber();
    }, []);

    return (
        <div>
            {/* Render your emprunt details here */}
            <p>Cathegorie: {cathegorie}</p>
            <p>Description: {desc}</p>
            <p>Exemplaire: {exemplaire}</p>
            <p>Date: {formatDate}</p>
            <p>Heure: {formatHeure}</p>
            {/* Add more fields as needed */}
        </div>
    );
};

export default CadreEmprunt;
