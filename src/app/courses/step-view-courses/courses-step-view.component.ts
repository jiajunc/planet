import { Component, OnInit, OnDestroy } from '@angular/core';
import { CoursesService } from '../courses.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../shared/user.service';

@Component({
  templateUrl: './courses-step-view.component.html',
  styleUrls: [ './courses-step-view.scss' ]
})

export class CoursesStepViewComponent implements OnInit, OnDestroy {

  onDestroy$ = new Subject<void>();
  stepNum = 0;
  stepDetail: any = { stepTitle: '', description: '' };
  maxStep = 1;
  resourceUrl = '';
  examStart = 1;
  attempts = 0;
  showExamButton = false;
  previewMode = true;
  resource: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private coursesService: CoursesService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.coursesService.courseUpdated$.pipe(takeUntil(this.onDestroy$)).subscribe((course: any) => {
      // To be readable by non-technical people stepNum param will start at 1
      this.stepDetail = course.steps[this.stepNum - 1];
      this.maxStep = course.steps.length;
      if (this.stepDetail.exam) {
        this.showExamButton = this.checkMyCourses(course._id);
        this.previewMode = !this.showExamButton;
        this.coursesService.openSubmission({
          parentId: this.stepDetail.exam._id + '@' + course._id,
          parent: this.stepDetail.exam,
          user: this.userService.get().name,
          type: 'exam' });
      }
      this.resource = this.stepDetail.resources ? this.stepDetail.resources[0] : undefined;
      this.coursesService.submissionUpdated$.pipe(takeUntil(this.onDestroy$)).subscribe(({ submission, attempts }) => {
        this.examStart = submission.answers.length + 1;
        this.attempts = attempts;
      });
    });
    this.route.paramMap.pipe(takeUntil(this.onDestroy$)).subscribe((params: ParamMap) => {
      this.stepNum = +params.get('stepNum'); // Leading + forces string to number
      this.coursesService.requestCourse({ courseId: params.get('id') });
    });
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  // direction = -1 for previous, 1 for next
  changeStep(direction) {
    this.router.navigate([ '../' + (this.stepNum + direction) ], { relativeTo: this.route });
  }

  backToCourseDetail() {
    this.router.navigate([ '../../' ], { relativeTo: this.route });
  }

  setResourceUrl(resourceUrl: string) {
    this.resourceUrl = resourceUrl;
  }

  checkMyCourses(courseId: string) {
    return this.userService.shelf.courseIds.includes(courseId);
  }

  onResourceChange(value) {
    this.resource = value;
  }

  goToExam() {
    if (this.previewMode) {
      this.router.navigate([ 'preview', this.examStart ], { relativeTo: this.route });
    } else {
      this.router.navigate([ 'exam', this.examStart ], { relativeTo: this.route });
    }
  }

}
