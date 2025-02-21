import React from "react";
import "../css/header.css";
import { useState, useEffect } from "react";

const Header = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  const toggleSideBar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };

  return (
    <>
      <div className="header">
        <i className="fa-solid fa-circle-info" onClick={toggleSideBar}></i>
        <h1>Farinha do Mesmo Saco</h1>
        {/* Sidebar */}
        <div className={`sidebar ${isSideBarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h2>Sobre o Jogo</h2>
            <i className="fa-solid fa-xmark" onClick={toggleSideBar}></i>
          </div>
          <div className="sidebar-content">
            <strong>🌟 Sobre "Farinha do Mesmo Saco" 🌟</strong>
            <p>
              <br /> "Farinha do Mesmo Saco" é a minha versão tupiniquim (100%
              brasileira, feita com carinho e café forte ☕) do famoso jogo{" "}
              <a
                target="_blank"
                href="https://www.nytimes.com/games/connections"
              >
                Connections do The New York Times
              </a>{" "}
              , aquele desafio viciante de encontrar relações escondidas entre
              palavras.
              <br />
              <br />
              <b>🤔 Por que esse nome?</b>
              <br />
              <br />
              Você já ouviu o ditado "É tudo farinha do mesmo saco"? Pois é! No
              jogo, assim como na vida, o objetivo é descobrir o que une certos
              elementos, exatamente como quando percebemos que, no fundo, tudo
              vem do mesmo lugar (ou, no caso, do mesmo saco de farinha 😉).
              Cada grupo de 4 palavras é como um punhado dessa farinha: parece
              solto, mas tem uma ligação secreta que só os mais atentos vão
              percebê-las!
              <br />
              <br />
            </p>
            <ul className="list">
              <li>
                <strong>Regras do jogo</strong>
                <p>
                  Há quatro temas escondidos entre as 16 palavras apresentadas
                  na tela, selecione 4 palavras, e se pertencerem a um mesmo
                  grupo, ele será revelado, caso contrario, perderá 1 das 4
                  chaces disponiveis para você, e para vencer basta descobrir os
                  4 temas do dia. Boa Sorte!
                  <br />
                  <br />
                </p>
              </li>
              <li>
                <strong>
                  Sobre mim <br />
                </strong>
                <p>
                  Construi esse joguinho para me desafiar, e descobrir se já era
                  um programador Front-end, e durante percebi que vou acabar me
                  tornando Fullstack. 🤣🤣
                  <br /> Abaixo você pode conferir um pouco mais!
                </p>
                <br />
              </li>
              <li>
                <strong>
                  Redes <br />
                </strong>
                <div className="redes">
                  <a target="_blank" href="https://github.com/Whydsley">
                    Github<i className="fa-brands fa-github"></i>
                  </a>
                  <a
                    target="_blank"
                    href="https://www.linkedin.com/in/whydsley-mello-a30ba8197/"
                  >
                    Linkedin<i className="fa-brands fa-linkedin"></i>
                  </a>
                  <a target="_blank" href="/">
                    Instagram<i className="fa-brands fa-instagram"></i>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
