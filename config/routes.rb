require "sidekiq/web"

Rails.application.routes.draw do
  authenticate :user do
    mount Sidekiq::Web => "/sidekiq"
  end

  namespace :api do
    devise_for :users, skip: [:sessions, :registrations]

    post "users/sign_in", to: "sessions#create"
    delete "users/sign_out", to: "sessions#destroy"
    post "users/sign_up", to: "registrations#create"

    get "users/search", to: "users#search"

    resources :projects, only: [ :index, :show, :create ] do
      resources :tasks, only: [ :index, :create, :update ]
      member do
        post "add_member"
        delete "remove_member/:user_id", to: "projects#remove_member", as: :remove_member
      end
    end

    get "dashboard", to: "dashboard#index"
  end

  root "dashboard#index"
end
