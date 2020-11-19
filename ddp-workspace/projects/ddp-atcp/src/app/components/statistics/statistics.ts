import { Component, OnDestroy, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import {
  StatisticsServiceAgent,
  Statistic,
  StatisticsResponse,
  StatisticTypes,
} from '../../services/serviceAgents/statisticsServiceAgent.service';

interface CountryDistribution {
  countryName: string;
  barWidth: number;
  emoji: string;
}

interface FormattedStatistics {
  totalParticipantsCount: number;
  countriesCount: number;
  genomeStudyParticipantsCount: number;
  kitsCount: number;
  governedParticipantsCount: number;
  selfEnrolledParticipantsCount: number;
  countriesDistribution: CountryDistribution[];
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.scss'],
})
export class StatisticsComponent implements OnInit, OnDestroy {
  public formattedStatistics: FormattedStatistics;
  public isLoading: boolean;
  public statisticListItems = [
    'totalParticipantsCount',
    'countriesCount',
    'genomeStudyParticipantsCount',
    'kitsCount',
    'governedParticipantsCount',
    'selfEnrolledParticipantsCount',
  ];

  private readonly PERFORM_DNA_STABLE_ID = 'PERFORM_DNA';
  private readonly GOVERNED_STATISTIC_TYPE = 'governed';
  private readonly SELF_ENROLLED_STATISTIC_TYPE = 'self';
  private readonly DISTRIBUTION_LIST_WIDTH = 240;
  private readonly DISTRIBUTION_BAR_MIN_WIDTH = 20;

  constructor(private statisticsService: StatisticsServiceAgent) {}

  public ngOnInit(): void {
    this.getStatistics();
  }

  public ngOnDestroy(): void {}

  private getStatistics(): void {
    this.isLoading = true;

    this.statisticsService
      .getStatistics()
      .pipe(take(1))
      .subscribe(statistics => {
        this.formattedStatistics = this.convertStatisticsResponse(statistics);
        this.isLoading = false;
      });
  }

  private convertStatisticsResponse(
    statistics: StatisticsResponse
  ): FormattedStatistics {
    const stats = {} as FormattedStatistics;

    statistics.forEach(statistic => {
      if (statistic.configuration.type === StatisticTypes.Distribution) {
        stats.totalParticipantsCount = this.getTotalParticipantsCount(
          statistic
        );
        stats.countriesCount = this.getCountriesCount(statistic);
        stats.countriesDistribution = this.getCountriesDistribution(
          statistic,
          stats.totalParticipantsCount
        );
      } else if (
        statistic.configuration.type === StatisticTypes.SpecificAnswer &&
        statistic.configuration.questionStableId === this.PERFORM_DNA_STABLE_ID
      ) {
        stats.genomeStudyParticipantsCount = this.getGenomeStudyParticipantsCount(
          statistic
        );
      } else if (statistic.configuration.type === StatisticTypes.Kits) {
        stats.kitsCount = this.getKitsCount(statistic);
      } else if (statistic.configuration.type === StatisticTypes.Participants) {
        stats.governedParticipantsCount = this.getParticipantsCount(
          statistic,
          this.GOVERNED_STATISTIC_TYPE
        );
        stats.selfEnrolledParticipantsCount = this.getParticipantsCount(
          statistic,
          this.SELF_ENROLLED_STATISTIC_TYPE
        );
      }
    });

    return stats;
  }

  private getTotalParticipantsCount(distributionStatistic: Statistic): number {
    if (!distributionStatistic.statistics.length) {
      return 0;
    }

    return distributionStatistic.statistics.reduce((count, country) => {
      return count + +country.data.count;
    }, 0);
  }

  private getCountriesCount(distributionStatistic: Statistic): number {
    return distributionStatistic.statistics.length;
  }

  private getGenomeStudyParticipantsCount(
    genomeStudyStatistic: Statistic
  ): number {
    if (!genomeStudyStatistic.statistics.length) {
      return 0;
    }

    return +genomeStudyStatistic.statistics[0].data.count;
  }

  private getKitsCount(kitsStatistic: Statistic): number {
    if (!kitsStatistic.statistics.length) {
      return 0;
    }

    return +kitsStatistic.statistics[0].data.count;
  }

  private getParticipantsCount(
    participantsStatistic: Statistic,
    fieldName: string
  ): number {
    const governedParticipantsStatistic = participantsStatistic.statistics.find(
      stat => stat.name === fieldName
    );

    if (!governedParticipantsStatistic) {
      return 0;
    }

    return +governedParticipantsStatistic.data.count;
  }

  private getCountriesDistribution(
    distributionStatistic: Statistic,
    totalParticipantsCount: number
  ): CountryDistribution[] {
    const unit = this.DISTRIBUTION_LIST_WIDTH / totalParticipantsCount;

    return distributionStatistic.statistics
      .map(stat => {
        const countryCode = stat.name;
        const countryName = stat.data.optionDetails.optionLabel;
        const barWidth = Math.floor(unit * +stat.data.count);
        const emoji = this.countryCodeToEmoji(countryCode);

        return {
          countryName,
          barWidth: Math.max(barWidth, this.DISTRIBUTION_BAR_MIN_WIDTH),
          emoji,
        };
      })
      .sort((a, b) => b.barWidth - a.barWidth);
  }

  private countryCodeToEmoji(countryCode: string): string {
    return countryCode
      .split('')
      .map(letter =>
        String.fromCodePoint(letter.toLowerCase().charCodeAt(0) + 127365)
      )
      .join('');
  }
}
