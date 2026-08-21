import {
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CastVoteDto {
  @IsUUID()
  @IsNotEmpty()
  candidateId!: string;
}