import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PinLoginDto {
  @ApiProperty({ example: 'uuid-of-staff-user' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  pin!: string;
}
