import { parse as csvParse } from "csv-parse";
import fs from "fs";

import { ICategoriesRepository } from "../../respositories/ICategoriesRepository";

interface IImportCategory {
  name: string;
  description: string;
}

export class ImportCategoryUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  private loadCategories(
    file: Express.Multer.File
  ): Promise<IImportCategory[]> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path);
      const categories: IImportCategory[] = [];

      const parseFile = csvParse();

      stream.pipe(parseFile);

      parseFile
        .on("data", async (line) => {
          const [name, description] = line;

          categories.push({
            name,
            description,
          });
        })
        .on("end", () => {
          fs.promises.unlink(file.path);
          resolve(categories);
        })
        .on("error", (err) => reject(err));
    });
  }

  async execute(file: Express.Multer.File) {
    const categories = await this.loadCategories(file);

    categories.forEach((category) => {
      const { name, description } = category;

      const foundCategory = this.categoriesRepository.findByName(name);

      if (!foundCategory) {
        this.categoriesRepository.create({ name, description });
      }
    });
  }
}
