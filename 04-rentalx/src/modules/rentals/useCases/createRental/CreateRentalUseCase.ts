import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { inject, injectable } from "tsyringe";

import { ICarsRepository } from "@modules/cars/repositories/ICarsRepository";
import { Rental } from "@modules/rentals/infra/typeorm/entities/rental";
import { IRentalsRepository } from "@modules/rentals/repositories/IRentalsRepository";
import { IDateProvider } from "@shared/container/providers/DateProvider/IDateProvider";
import { AppError } from "@shared/errors/AppError";

dayjs.extend(utc);

interface IRequest {
  user_id: string;
  car_id: string;
  expected_return_date: Date;
}

@injectable()
export class CreateRentalUseCase {
  constructor(
    @inject("RentalsRepository")
    private rentalsRepository: IRentalsRepository,
    @inject("CarsRepository")
    private carsRepository: ICarsRepository,
    @inject("DateProvider")
    private dateProvider: IDateProvider
  ) {}

  async execute({
    user_id,
    car_id,
    expected_return_date,
  }: IRequest): Promise<Rental> {
    const foundCar = this.rentalsRepository.findActiveRentalByCarId(car_id);

    if (foundCar) {
      throw new AppError("Car is unavailable");
    }

    const foundUser = this.rentalsRepository.findActiveRentalByUserId(user_id);

    if (foundUser) {
      throw new AppError("There's an active rental by this user");
    }

    const minimunDuration = 24;

    const currentDate = this.dateProvider.getCurrentDate();
    const diffInHours = this.dateProvider.compareDatesInHours(
      currentDate,
      expected_return_date
    );

    if (diffInHours < minimunDuration) {
      throw new AppError("Invalid return date");
    }

    const rental = await this.rentalsRepository.create({
      user_id,
      car_id,
      expected_return_date,
    });

    await this.carsRepository.updateAvailable(car_id, false);

    return rental;
  }
}
