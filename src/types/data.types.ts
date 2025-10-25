import { FabricImage } from "fabric";

export type Ball = {
  number: number;
  inTable: boolean;
  imageUrl: string;
  image: FabricImage;
};