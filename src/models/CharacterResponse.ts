
export interface CharacterResponse {
  name: string;
  homeWorld: string;
}

export interface DetailedCharacterResponse extends CharacterResponse {
  height: string;
  mass: string;
  gender: string;
  hairColor: string;
  skinColor: string;
  films: string[];
}